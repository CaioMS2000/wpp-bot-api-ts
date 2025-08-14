import { logger } from '@/logger'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const REQUEST_LOG_PATH = path.resolve(process.cwd(), 'request-logs.json')

export async function appendRequestLog(entry: unknown) {
	try {
		let fileData: { logs: unknown[] } = { logs: [] }

		try {
			// tenta ler o arquivo existente
			const existing = await fs.readFile(REQUEST_LOG_PATH, 'utf8')
			fileData = JSON.parse(existing)
			// garante que tem a chave logs
			if (!Array.isArray(fileData.logs)) {
				fileData.logs = []
			}
		} catch (readErr) {
			// se o arquivo não existir ou for inválido, começa do zero
			fileData = { logs: [] }
		}

		// adiciona o novo log
		fileData.logs.push(entry)

		// sobrescreve o arquivo formatado
		await fs.writeFile(
			REQUEST_LOG_PATH,
			JSON.stringify(fileData, null, 2), // indentado p/ leitura
			'utf8'
		)
	} catch (err) {
		logger.error({ err }, 'Falha ao gravar request-logs.json')
	}
}
