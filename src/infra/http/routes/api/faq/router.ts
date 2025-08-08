import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../@types'
import { createFAQ } from './create-faq'
import { deleteFAQCategory } from './delete-faq-category'
import { deleteFAQItem } from './delete-faq-item'
import { getFAQs } from './get-faqs'
import { updateFAQCategoryName } from './update-faq-category-name'
import { updateFAQItem } from './update-faq-item'

const routes = [
	updateFAQItem,
	updateFAQCategoryName,
	getFAQs,
	deleteFAQItem,
	deleteFAQCategory,
	createFAQ,
] as const

type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(updateFAQItem, {
			updateFAQItemUseCase: resources.updateFAQItemUseCase,
		})
		app.register(updateFAQCategoryName, {
			updateFAQCategoryNameUseCase: resources.updateFAQCategoryNameUseCase,
		})
		app.register(getFAQs, { getFAQsUseCase: resources.getFAQsUseCase })
		app.register(deleteFAQItem, {
			deleteFAQItemUseCase: resources.deleteFAQItemUseCase,
		})
		app.register(deleteFAQCategory, {
			deleteFAQCategoryUseCase: resources.deleteFAQCategoryUseCase,
		})
		app.register(createFAQ, { createFAQUseCase: resources.createFAQUseCase })
	}
)
