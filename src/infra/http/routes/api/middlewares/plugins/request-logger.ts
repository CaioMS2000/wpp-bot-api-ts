import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import fs from 'node:fs'
import path from 'node:path'
import { logger } from '@/logger'
import { findProjectRoot } from '@/utils/files'

export const requestLogger = fastifyPlugin(async (app: FastifyInstance) => {
	const projectRoot = findProjectRoot(__dirname)
	const requestLogPath = path.join(projectRoot, 'request-logs.json')

	app.addHook('preHandler', async (request, reply) => {
		try {
			const logEntry = {
				timestamp: new Date().toISOString(),
				method: request.method,
				url: request.url,
				headers: request.headers,
				query: request.query,
				params: request.params,
				body: request.body,
			}

			let logData: { requests: any[] }

			if (fs.existsSync(requestLogPath)) {
				try {
					const fileContent = fs.readFileSync(requestLogPath, 'utf-8')
					const parsed = JSON.parse(fileContent)

					logData =
						parsed && Array.isArray(parsed.requests) ? parsed : { requests: [] }
				} catch (error) {
					logger.warn(
						{ error },
						'Falha ao ler/parsing request-logs.json. Inicializando novo log.'
					)
					logData = { requests: [] }
				}
			} else {
				logData = { requests: [] }
			}

			logData.requests.push(logEntry)
			fs.writeFileSync(
				requestLogPath,
				JSON.stringify(logData, null, 2),
				'utf-8'
			)

			logger.debug(`Request registrada: ${request.method} ${request.url}`)
		} catch (error) {
			logger.error({ error }, 'Erro ao registrar log de requisição')
		}
	})

	app.addHook('onResponse', async (request, reply) => {
		logger.info(
			`Response: ${reply.statusCode} - ${request.method} ${request.url}`
		)
	})
})
