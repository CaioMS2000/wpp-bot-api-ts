import { FileService } from '@/infra/storage/file-service'
import { Allowed as LocalFileServiceAllowedMedia } from '@/infra/storage/local/local-file-service'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

import { PassThrough } from 'node:stream'
import { logger } from '@/logger'

type Resources = {
	fileService: FileService<LocalFileServiceAllowedMedia>
}

const paramsSchema = z.object({
	cnpj: z.string().min(1),
	key: z.string().min(1),
})

const querySchema = z.object({
	disposition: z.enum(['inline', 'attachment']).default('inline'),
})

export async function readFile(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/files/:key',
			{
				schema: { params: paramsSchema, querystring: querySchema },
			},
			async (req, reply) => {
				const { cnpj, key } = req.params as z.infer<typeof paramsSchema>
				const { disposition } = req.query as z.infer<typeof querySchema>
				const { company } = await req.getUserMembership(cnpj)
				const f = await resources.fileService.read(key, company.id, {
					mode: 'stream',
				})

				logger.debug('download:start', {
					key,
					expectedSize: f.size,
					mime: f.mime,
				})

				const counter = new PassThrough()
				let sent = 0
				counter.on('data', chunk => {
					sent += chunk.length
				})
				f.stream.on('error', err => {
					req.log.error({ err, key }, 'download:stream_error')
					if (!reply.sent) reply.code(500).send({ message: 'Erro no stream' })
				})

				reply
					.header('Content-Type', f.mime)
					.header('Content-Length', String(f.size))
					.header(
						'Content-Disposition',
						`${disposition}; filename="${encodeURIComponent(f.filename)}"`
					)
					.header(
						'Last-Modified',
						f.createdAt?.toUTCString?.() ?? new Date().toUTCString()
					)

				// Dica: se você já armazena/expõe um checksum, pode setar ETag aqui
				// reply.header('ETag', `"${f.checksum}"`)
				// reply.send(f.stream)

				reply.raw.on('finish', () => {
					req.log.info({ key, sent }, 'download:finish') // bytes enviados
				})
				reply.raw.on('close', () => {
					req.log.info({ key, sent }, 'download:client_closed')
				})

				f.stream.pipe(counter)
				return reply.send(counter)
			}
		)
}
