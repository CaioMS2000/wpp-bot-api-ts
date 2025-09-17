import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../../@types'
import { uploadFiles } from './upload-files'
import { listFiles } from './list-files'
import { deleteFile } from './delete-file'

const routes = [uploadFiles, listFiles, deleteFile] as const
type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(uploadFiles, {
			fileService: resources.fileService,
			prisma: resources.prisma,
			openaiRegistry: resources.openaiRegistry,
		})
		app.register(listFiles, { prisma: resources.prisma })
		app.register(deleteFile, {
			prisma: resources.prisma,
			fileService: resources.fileService,
			openaiRegistry: resources.openaiRegistry,
		})
	}
)
