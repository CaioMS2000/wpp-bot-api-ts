import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../@types'
import { createCompany } from './create-company'
import { getCompanyInfo } from './get-company-info'
import { updateCompany } from './update-company'

const routes = [updateCompany, getCompanyInfo, createCompany] as const

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
	}
)
