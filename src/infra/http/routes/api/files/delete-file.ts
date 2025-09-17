import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'
import { FileService } from '@/infra/storage/file-service'
import { OpenAIClientRegistry } from '@/infra/openai/OpenAIClientRegistry'

const paramsSchema = z.object({
	cnpj: z.string().min(1),
	id: z.string().min(1),
})
const ErrorEnvelope = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		hint: z.string().optional(),
		details: z.any().optional(),
	}),
})

const responseSchema = {
	200: z.object({ deleted: z.boolean() }),
	400: ErrorEnvelope,
	404: z.object({ deleted: z.boolean() }),
}

type Resources = {
	prisma: PrismaClient
	fileService: FileService<any>
	openaiRegistry: OpenAIClientRegistry
}

export async function deleteFile(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete('/api/tenant/:cnpj/files/:id', {
			schema: {
				tags: ['Files'],
				summary: 'Delete uploaded file',
				params: paramsSchema,
				response: responseSchema,
			},
			handler: async (req, reply) => {
				if (!req.params.id || typeof req.params.id !== 'string') {
					return reply.status(400).send({
						error: {
							code: 'INVALID_FILE_ID',
							message: 'ID de arquivo inválido.',
							hint: 'Forneça um ID ou chave de arquivo válido na URL.',
						},
					})
				}
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				const identifier = req.params.id
				// Accept either DB id or storage key in the path param
				const row = await resources.prisma.file.findFirst({
					where: {
						tenantId: tenant.id,
						OR: [{ id: identifier }, { key: identifier }],
					},
				})
				if (!row) return reply.status(404).send({ deleted: false })

				// Best-effort: remove from vector store and OpenAI file registry
				const openaiFileId = row.indexInStorage || undefined
				if (openaiFileId) {
					try {
						const vsm =
							await resources.openaiRegistry.getVectorStoreManagerForTenant(
								tenant.id
							)
						const storeId = await vsm.ensureVectorStoreForTenant(tenant.id)
						const openai = await resources.openaiRegistry.getClientForTenant(
							tenant.id
						)
						await openai.vectorStores.files.delete(openaiFileId, {
							vector_store_id: storeId,
						})
					} catch (err) {
						console.warn('[Files] vectorStores.files.delete failed', { err })
					}
					try {
						const openai = await resources.openaiRegistry.getClientForTenant(
							tenant.id
						)
						await openai.files.delete(openaiFileId)
					} catch (err) {
						console.warn('[Files] openai.files.delete failed', { err })
					}
				}

				// Remove from our storage (S3/R2 or local)
				try {
					if (row.key)
						await resources.fileService.removeByKey(row.key, tenant.id)
				} catch (err) {
					console.warn('[Files] fileService.removeByKey failed', { err })
				}

				// Remove DB row
				await resources.prisma.file.delete({ where: { id: row.id } })
				return reply.send({ deleted: true })
			},
		})
}
