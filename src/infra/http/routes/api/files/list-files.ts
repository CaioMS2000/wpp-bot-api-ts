import { env } from '@/config/env'
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'
import type { PrismaClient } from '@prisma/client'

const paramsSchema = z.object({ cnpj: z.string().min(1) })
const responseSchema = {
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

type Resources = { prisma: PrismaClient }

export async function listFiles(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/files', {
			schema: {
				tags: ['Files'],
				summary: 'List uploaded files',
				params: paramsSchema,
				response: responseSchema,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				const rows = await resources.prisma.file.findMany({
					where: { tenantId: tenant.id },
					select: { key: true, name: true, contentType: true },
				})
				if (!rows.length) return reply.send({ files: [] })

				const endpoint = env.CLOUDFLARE_ENDPOINT || undefined
				const region = endpoint ? 'auto' : 'us-east-1'
				const s3 = new S3Client({
					region,
					endpoint,
					forcePathStyle: Boolean(endpoint),
					credentials: {
						accessKeyId: env.AWS_ACCESS_KEY_ID,
						secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
					},
				})

				const files = await Promise.all(
					rows.map(async row => {
						const head = await s3.send(
							new HeadObjectCommand({
								Bucket: env.AWS_BUCKET_NAME,
								Key: row.key,
							})
						)
						const mime = (row.contentType ??
							head.ContentType ??
							'application/octet-stream') as string
						const size = Number(head.ContentLength ?? 0)
						const metaFilename = head.Metadata?.filename
							? decodeURIComponent(head.Metadata.filename)
							: undefined
						const filename = metaFilename || row.name || row.key
						return { key: row.key, filename, mime, size }
					})
				)

				return reply.send({ files })
			},
		})
}
