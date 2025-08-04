import { BusinessHoursType } from '@/domain/web-api/@types'
import { businessHoursSchema } from '@/domain/web-api/@types/schemas'
import { GetCompanyUseCase } from '@/domain/web-api/use-cases/get-company-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	getCompanyUseCase: GetCompanyUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
})

const responseSchema = z.object({
	company: z.object({
		name: z.string(),
		phone: z.string(),
		email: z.string().nullable(),
		website: z.string().nullable(),
		description: z.string().nullable(),
		cnpj: z.string(),
		managerId: z.string(),
		businessHours: businessHoursSchema,
	}),
})

export async function getCompanyInfo(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/info',
			{
				schema: {
					tags: ['company'],
					summary: 'Obter informações da empresa',
					security: [{ bearerAuth: [] }],
					params: paramsSchema,
					response: {
						'200': responseSchema,
					},
				},
			},
			async (request, reply) => {
				const { getCompanyUseCase } = resources
				const { company: authCompany } = await request.getUserMembership(
					request.params.cnpj
				)
				const company = await getCompanyUseCase.execute(authCompany.id)
				const businessHours: BusinessHoursType = []

				company.businessHours.getDays().forEach(day => {
					const parsedDay = {
						open: day.openTime,
						close: day.closeTime,
						dayOfWeek: day.weekDay,
					}

					businessHours.push(parsedDay)
				})

				const data = {
					name: company.name,
					phone: company.phone,
					email: company.email,
					website: company.website,
					description: company.description,
					cnpj: company.cnpj,
					managerId: company.managerId,
					businessHours,
				}

				return reply.status(200).send({
					company: data,
				})
			}
		)
}
