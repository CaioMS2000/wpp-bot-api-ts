import pdfParse from 'pdf-parse'
import { downloadMediaById } from '@/infra/whatsapp/client'
import { OpenAIClientRegistry } from './OpenAIClientRegistry'

export class EnergyBillIngestionService {
	constructor(private readonly clientRegistry: OpenAIClientRegistry) {}

	async processEnergyBillPdf(
		tenantId: string,
		mediaId: string,
		filename?: string | null
	): Promise<{ summary: string; complete: boolean; missingFields: string[] }> {
		console.log('[EnergyBillIngestion] start', { tenantId, mediaId, filename })
		const { data } = await downloadMediaById(mediaId)
		const buffer = Buffer.from(new Uint8Array(data))
		console.log('[EnergyBillIngestion] media downloaded', {
			tenantId,
			mediaId,
			bytes: buffer.byteLength,
		})
		const parsed: any = await pdfParse(buffer)
		const raw = String(parsed?.text || '').trim()
		console.log('[EnergyBillIngestion] pdf parsed', {
			tenantId,
			mediaId,
			textLen: raw.length,
		})
		if (!raw) {
			return {
				summary: 'PDF recebido, mas não consegui extrair texto legível.',
				complete: false,
				missingFields: ['sem_texto_extraido'],
			}
		}

		const openai = await this.clientRegistry.getClientForTenant(tenantId)
		const system = [
			'Você é um extrator de dados de contas de energia elétrica.',
			'Extraia CAMPOS CRÍTICOS e retorne EXCLUSIVAMENTE um JSON com o formato:',
			'{"complete": boolean, "missing_fields": string[], "concise_summary": string, "fields": { "consumo_kwh_mes": number|null }}',
			'Critérios de complete=true: nenhum campo essencial ausente. Campos essenciais: distribuidora, numero_conta_ou_instalacao, unidade_consumidora (se houver), periodo (início e fim) e/ou mes_referencia, data_vencimento, consumos_kwh (por faixa/tarifa se aplicável), tarifas/bandeiras/impostos (ao menos totais), valor_total, codigo_barras_ou_linha_digitavel (se existir).',
			'Preencha missing_fields com os nomes dos campos essenciais ausentes ou ilegíveis.',
			'concise_summary: texto curto para o usuário com os principais dados e valores (máx ~2000 caracteres).',
			'Regras: Não invente valores. Preserve números e datas. Formate valores em R$ quando aplicável.',
			filename ? `Arquivo: ${filename}` : undefined,
		]
			.filter(Boolean)
			.join('\n')

		const user = [
			'TEXTO EXTRAÍDO DO PDF (use apenas para análise; retorne apenas JSON):\n',
			raw,
		]
			.join('\n')
			.slice(0, 200_000)

		let outSummary = ''
		let complete = false
		let missing: string[] = []
		let consumoKwhMes: number | null = null
		const tryParseJson = (
			text: string
		): { parsed: any; source: 'raw' | 'fence' | 'object' } | null => {
			// 1) raw JSON
			try {
				return { parsed: JSON.parse(text), source: 'raw' }
			} catch {}
			// 2) fenced JSON ```json ... ```
			const fenceJson = text.match(/```json\s*([\s\S]*?)```/i)
			if (fenceJson && fenceJson[1]) {
				const inner = fenceJson[1].trim()
				try {
					return { parsed: JSON.parse(inner), source: 'fence' }
				} catch {}
			}
			// 3) generic fenced block ``` ... ```
			const fenceAny = text.match(/```\s*([\s\S]*?)```/)
			if (fenceAny && fenceAny[1]) {
				const inner = fenceAny[1].trim()
				try {
					return { parsed: JSON.parse(inner), source: 'fence' }
				} catch {}
			}
			// 4) first JSON-looking object
			const objMatch = text.match(/\{[\s\S]*\}/)
			if (objMatch) {
				try {
					return { parsed: JSON.parse(objMatch[0]), source: 'object' }
				} catch {}
			}
			return null
		}

		const cleanSummary = (text: string): string => {
			if (!text) return ''
			// remove fenced code blocks
			let s = text.replace(/```[\s\S]*?```/g, '').trim()
			// remove lines that look like pure JSON braces noise
			s = s.replace(/^[\s\{\}\[\]\",:]+$/gm, '').trim()
			// collapse excessive blank lines
			s = s.replace(/\n{3,}/g, '\n\n')
			return s
		}

		console.log('[EnergyBillIngestion] starting OpenAI analysis', {
			tenantId,
			mediaId,
			pdfTextLength: raw.length,
			systemPromptLength: system.length,
			userPromptLength: user.length,
		})

		try {
			const res = await openai.responses.create({
				model: 'gpt-4o-mini',
				input: [
					{ role: 'system', content: system },
					{ role: 'user', content: user },
				],
				max_output_tokens: 1800,
			})
			console.log('[EnergyBillIngestion] openai.responses.create ok', {
				tenantId,
				mediaId,
				responseId: res.id,
				inputTokens: res.usage?.input_tokens,
				outputTokens: res.usage?.output_tokens,
			})
			const rawOut = String(res.output_text ?? '').trim()
			try {
				const jp = tryParseJson(rawOut)
				if (!jp) throw new Error('no-json')
				const p = jp.parsed
				outSummary = cleanSummary(String(p?.concise_summary ?? '').trim())
				const mf = Array.isArray(p?.missing_fields)
					? p.missing_fields.map((x: any) => String(x))
					: []
				missing = mf
				complete =
					Boolean(p?.complete) && mf.length === 0 && outSummary.length > 0
				if (p?.fields && typeof p.fields.consumo_kwh_mes !== 'undefined') {
					const v = p.fields.consumo_kwh_mes
					const n = Number(v)
					consumoKwhMes = Number.isFinite(n) ? n : null
				}
				console.log('[EnergyBillIngestion] extraction parsed', {
					complete,
					missingCount: missing.length,
					summaryLen: outSummary.length,
					consumoKwhMes,
					source: jp.source,
				})
			} catch (parseError) {
				// Fallback: remove qualquer bloco de código/JSON do texto bruto
				outSummary = cleanSummary(rawOut || raw.slice(0, 4000))
				complete = false
				missing = ['resultado_em_formato_invalido']
				console.warn(
					'[EnergyBillIngestion] extraction not JSON, using fallback text',
					{
						rawOutputLength: rawOut?.length || 0,
						summaryLen: outSummary.length,
						parseError: String(parseError),
					}
				)
			}
		} catch (err) {
			console.error('[EnergyBillIngestion] openai extraction failed', err)
			outSummary = raw.slice(0, 4000)
			complete = false
			missing = ['falha_processamento']
		}
		if (outSummary.length > 4000) outSummary = outSummary.slice(0, 4000)
		const marker = `[[ENERGY_BILL]] ${JSON.stringify({ complete, consumo_kwh_mes: consumoKwhMes })}`
		const composed = `${marker}\n${cleanSummary(outSummary)}`
		console.log('[EnergyBillIngestion] done', {
			tenantId,
			mediaId,
			complete,
			missingCount: missing.length,
			composedLen: composed.length,
		})
		return { summary: composed, complete, missingFields: missing }
	}
}
