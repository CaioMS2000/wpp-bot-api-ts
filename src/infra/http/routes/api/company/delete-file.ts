import { FileService } from '@/infra/storage/file-service'
import { Allowed as LocalFileServiceAllowedMedia } from '@/infra/storage/local/local-file-service'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	fileService: FileService<LocalFileServiceAllowedMedia>
}

const paramsSchema = z.object({
	cnpj: z.string().min(1),
	key: z.string().min(1),
})

export async function deleteFile(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete(
			'/api/company/:cnpj/files/:key',
			{
				schema: { params: paramsSchema },
			},
			async (req, reply) => {
				const { cnpj, key } = req.params
				const { company } = await req.getUserMembership(cnpj)

				await resources.fileService.delete(key, company.id)

				return reply.status(204).send()
			}
		)
}
