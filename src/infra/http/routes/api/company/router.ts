import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../@types'
import { createCompany } from './create-company'
import { deleteFile } from './delete-file'
import { getCompanyInfo } from './get-company-info'
import { listFiles } from './list-files'
import { readFile } from './read-file'
import { updateCompany } from './update-company'
import { uploadFiles } from './upload-files'

const routes = [
	updateCompany,
	getCompanyInfo,
	createCompany,
	uploadFiles,
	readFile,
	listFiles,
	deleteFile,
] as const

type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(updateCompany, {
			updateCompanyUseCase: resources.updateCompanyUseCase,
		})
		app.register(getCompanyInfo, {
			getCompanyUseCase: resources.getCompanyUseCase,
		})
		app.register(createCompany, {
			createCompanyUseCase: resources.createCompanyUseCase,
		})
		app.register(uploadFiles, {
			fileService: resources.fileService,
		})
		app.register(readFile, {
			fileService: resources.fileService,
		})
		app.register(listFiles, {
			fileService: resources.fileService,
		})
		app.register(deleteFile, {
			fileService: resources.fileService,
		})
	}
)
