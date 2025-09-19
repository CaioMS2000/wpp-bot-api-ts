import { logger } from '@/infra/logging/logger'
import type { CustomerRepository } from '@/repository/CustomerRepository'
import type { DepartmentRepository } from '@/repository/DepartmentRepository'
import type { TenantRepository } from '@/repository/TenantRepository'
import { z } from 'zod'
import { FunctionToolRegistry, defineFunctionTool } from './FunctionTools'

export function registerBuiltinTools(
	registry: FunctionToolRegistry,
	deps: {
		tenantRepo: TenantRepository
		departmentRepo: DepartmentRepository
		customerRepo: CustomerRepository
	}
): void {
	const handoffToDepartment = defineFunctionTool(async ctx => {
		const depts = await deps.departmentRepo.listDepartments(ctx.tenantId)
		const hasDepts = Array.isArray(depts) && depts.length > 0
		const enumSchema = hasDepts
			? z.enum(depts as unknown as [string, ...string[]])
			: z.string().min(1)
		const description = hasDepts
			? 'Encaminha o cliente para um departamento específico (entra na fila). Pergunte qual o departamento desejado antes de usar. Se ele informar um departamento inválido, pergunte novamente até que ele informe um válido.'
			: 'Encaminha o cliente para um departamento (nenhum departamento cadastrado no momento).'

		return {
			name: 'transferir',
			description,
			schema: z.object({ department: enumSchema }),
			async handler(args, innerCtx) {
				const wanted = String(args.department).trim()
				const exists = depts.some(d => d.toLowerCase() === wanted.toLowerCase())
				if (!exists) {
					return {
						ok: false,
						error: 'unknown_department',
						provided: wanted,
						available: depts,
					}
				}
				return { intent: 'ENTER_QUEUE', department: wanted }
			},
		}
	})

	// Tool: atualizar dados do cliente (somente clientes; restrição via descrição/prompt)
	const updateCustomerData = defineFunctionTool({
		name: 'atualizar_dados_cliente',
		description:
			'Atualiza dados cadastrais do CLIENTE (não use para funcionários). Use esta ferramenta somente após o cliente fornecer explicitamente os valores. Campos aceitos: name, email, profession. O telefone é inferido pelo contexto.',
		// Strict tools exigem 'required' com todas as chaves; use null para ausentes
		schema: z.object({
			name: z.string().min(1).nullable(),
			email: z.string().email().nullable(),
			profession: z.string().min(1).nullable(),
		}),
		async handler(args, ctx) {
			const name = typeof args.name === 'string' ? args.name.trim() : undefined
			const email =
				typeof args.email === 'string' ? args.email.trim() : undefined
			const profession =
				typeof args.profession === 'string' ? args.profession.trim() : undefined
			// Persist (upsert mantém existentes quando campo vem undefined)
			const saved = await deps.customerRepo.upsert(
				ctx.tenantId,
				ctx.userPhone,
				name,
				email,
				profession
			)
			// Retorna visão completa do cadastro após salvar
			return {
				ok: true,
				customer: {
					phone: saved.phone,
					name: saved.name ?? null,
					email: saved.email ?? null,
					profession: saved.profession ?? null,
				},
			}
		},
	})

	registry.add(handoffToDepartment).add(updateCustomerData)

	// Tool: finalizar conversa com a IA
	const finalizeAIChat = defineFunctionTool({
		name: 'finalizar_conversa',
		description:
			'Finaliza a conversa atual com a IA quando o usuário indicar que deseja encerrar (mesmo sem usar os comandos explícitos). Use quando o cliente sinalizar claramente que quer terminar.',
		// Em tools strict, todos os campos precisam estar em `required`. Use null para ausentes.
		schema: z.object({
			motivo: z
				.string()
				.min(1)
				.nullable()
				.describe('Motivo opcional de encerramento'),
		}),
		async handler(args, _ctx) {
			const reason = typeof args.motivo === 'string' ? args.motivo : undefined
			return { intent: 'END_AI_CHAT', reason }
		},
	})

	// Tool: simular usina com base no CONSUMO mensal (kWh)
	const simulateByConsumption = defineFunctionTool({
		name: 'simular_usina_por_consumo',
		description:
			'Calcula dimensionamento e geração estimada de uma usina fotovoltaica com base no CONSUMO MENSAL (kWh). Somente para CLIENTES.\n' +
			'Parâmetros:\n- consumo_kwh_mes: consumo do cliente (kWh/mês).\n- grupo: "A" ou "B".\n- tipo: "solo" (usina em solo) ou "telhado" (qualquer telhado/cobertura).\n' +
			'Se faltar uma informação, pergunte objetivamente ao cliente antes de chamar a ferramenta.\n' +
			'IMPORTANTE: Após usar esta ferramenta, sempre mencione que existe também a opção de simular por área disponível (simular_usina_por_area) caso o cliente tenha um espaço específico em mente.',
		schema: z.object({
			consumo_kwh_mes: z.number().positive(),
			grupo: z.enum(['A', 'B']),
			tipo: z.enum(['solo', 'telhado']),
		}),
		async handler(args, context) {
			const consumo = Number(args.consumo_kwh_mes)
			const grupo = args.grupo
			const tipo = args.tipo

			logger.info('simulation_by_consumption', {
				component: 'SimulationTool',
				tenantId: context.tenantId,
				userPhone: context.userPhone,
				consumo_kwh_mes: consumo,
				grupo,
				tipo,
				conversationId: context.conversationId,
			})
			const tarifa = grupo === 'A' ? 0.67 : 0.9 // R$/kWh (aprox)
			const gcr = tipo.toLowerCase() === 'solo' ? 0.6 : 0.85
			const perdas = 0.15
			const potModulo = 0.55 // kWp por módulo
			const areaModulo = 3.4 // m² por módulo
			const tempoDia = 5 // h de sol pico (aprox)

			const consumoDia = consumo / 30
			const potNecessaria = consumoDia / (tempoDia * (1 - perdas))
			const qtdModulos = Math.ceil(potNecessaria / potModulo)
			const potTotal = qtdModulos * potModulo
			const areaTotal = (qtdModulos * areaModulo) / gcr
			const energiaMes = potTotal * tempoDia * 30 * (1 - perdas)
			const energiaAno = energiaMes * 12
			const custoMesAtual = consumo * tarifa
			let econMes = energiaMes * tarifa
			if (econMes > custoMesAtual) econMes = custoMesAtual
			const econAno = econMes * 12

			const result = {
				qtd_modulos: qtdModulos,
				potencia_usina_kwp: Number(potTotal.toFixed(2)),
				area_total_m2: Number(areaTotal.toFixed(2)),
				energia_mes_kwh: Number(energiaMes.toFixed(0)),
				energia_ano_kwh: Number(energiaAno.toFixed(0)),
				economia_mes_rs: Number(econMes.toFixed(2)),
				economia_ano_rs: Number(econAno.toFixed(2)),
			}

			// Log de resultado removido para evitar ruído excessivo

			return result
		},
	})

	// Tool: simular usina com base na ÁREA disponível (m²)
	const simulateByArea = defineFunctionTool({
		name: 'simular_usina_por_area',
		description:
			'Calcula dimensionamento e geração estimada com base na ÁREA disponível (m²). Somente para CLIENTES.\n' +
			'Parâmetros:\n- area_m2: área disponível (m²).\n- grupo: "A" ou "B".\n- tipo: "solo" (usina em solo) ou "telhado" (qualquer telhado/cobertura).\n' +
			'Se faltar uma informação, pergunte objetivamente ao cliente antes de chamar a ferramenta.\n' +
			'IMPORTANTE: Esta simulação maximiza o aproveitamento do espaço. Existe também a opção de simular por consumo mensal (simular_usina_por_consumo) para dimensionar conforme o gasto atual do cliente.',
		schema: z.object({
			area_m2: z.number().positive(),
			grupo: z.enum(['A', 'B']),
			tipo: z.enum(['solo', 'telhado']),
		}),
		async handler(args, context) {
			const area = Number(args.area_m2)
			const grupo = args.grupo
			const tipo = args.tipo

			logger.info('simulation_by_area', {
				component: 'SimulationTool',
				tenantId: context.tenantId,
				userPhone: context.userPhone,
				area_m2: area,
				grupo,
				tipo,
				conversationId: context.conversationId,
			})
			const tarifa = grupo === 'A' ? 0.67 : 0.9 // R$/kWh (aprox)
			const gcr = tipo.toLowerCase() === 'solo' ? 0.6 : 0.85
			const perdas = 0.15
			const potModulo = 0.55 // kWp por módulo
			const areaModulo = 3.4 // m² por módulo
			const tempoDia = 5 // h de sol pico (aprox)

			const qtdModulos = Math.floor((area * gcr) / areaModulo)
			const potTotal = qtdModulos * potModulo
			const energiaMes = potTotal * tempoDia * 30 * (1 - perdas)
			const energiaAno = energiaMes * 12
			const receitaMes = energiaMes * tarifa
			const receitaAno = receitaMes * 12

			const result = {
				qtd_modulos: qtdModulos,
				potencia_usina_kwp: Number(potTotal.toFixed(2)),
				area_total_m2: Number(area.toFixed(2)),
				energia_mes_kwh: Number(energiaMes.toFixed(0)),
				energia_ano_kwh: Number(energiaAno.toFixed(0)),
				receita_mes_rs: Number(receitaMes.toFixed(2)),
				receita_ano_rs: Number(receitaAno.toFixed(2)),
			}

			// Log de resultado removido para evitar ruído excessivo

			return result
		},
	})

	registry.add(finalizeAIChat)
	registry.add(simulateByConsumption).add(simulateByArea)
}
