import { FileService } from '@/infra/storage/file-service'
import { Allowed as LocalFileServiceAllowedMedia } from '@/infra/storage/local/local-file-service'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = { fileService: FileService<LocalFileServiceAllowedMedia> }

const paramsSchema = z.object({
	cnpj: z.string().min(1),
})

const replySchema = {
	200: z.object({
		files: z.array(
			z.object({
				key: z.string(),
				filename: z.string(),
				mime: z.string(),
				size: z.number(),
			})
		),
	}),
}

export async function listFiles(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/files',
			{
				schema: { params: paramsSchema, response: replySchema },
			},
			async (req, reply) => {
				const { cnpj } = paramsSchema.parse(req.params)

				// garante que o usuário tem acesso à empresa
				const { company } = await req.getUserMembership(cnpj)

				const files = await resources.fileService.list(company.id)

				// retorna exatamente o que o service fornece (sem paginação/ordenação extra)
				return reply.send({ files })
			}
		)
}
