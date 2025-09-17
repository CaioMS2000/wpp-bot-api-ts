import fs from 'node:fs'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

export const requestLogger = fastifyPlugin(async (app: FastifyInstance) => {
	app.addHook('preHandler', async (request, reply) => {
		const logEntry = {
			timestamp: new Date().toISOString(),
			method: request.method,
			url: request.url,
			headers: request.headers,
			query: request.query,
			params: request.params,
			body: request.body,
		}

		console.log(logEntry)
	})

	app.addHook('onResponse', async (request, reply) => {
		console.log(
			`Response: ${reply.statusCode} - ${request.method} ${request.url}`
		)
	})
})
