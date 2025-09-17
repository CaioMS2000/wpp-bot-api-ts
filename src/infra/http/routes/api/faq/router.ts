import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../../@types'
import { createCategory } from './category/create-category'
import { deleteCategory } from './category/delete-category'
import { getCategory } from './category/get-category'
import { listCategories } from './category/list-categories'
import { updateCategory } from './category/update-category'
import { createEntry } from './entry/create-entry'
import { deleteEntry } from './entry/delete-entry'
import { getEntry } from './entry/get-entry'
import { listEntries } from './entry/list-entries'
import { updateEntry } from './entry/update-entry'

const routes = [
	createCategory,
	updateCategory,
	getCategory,
	listCategories,
	deleteCategory,
	createEntry,
	updateEntry,
	getEntry,
	listEntries,
	deleteEntry,
] as const
type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(createCategory, { faqRepository: resources.faqRepository })
		app.register(updateCategory, { faqRepository: resources.faqRepository })
		app.register(getCategory, { faqRepository: resources.faqRepository })
		app.register(listCategories, { faqRepository: resources.faqRepository })
		app.register(deleteCategory, { faqRepository: resources.faqRepository })
		app.register(createEntry, { faqRepository: resources.faqRepository })
		app.register(updateEntry, { faqRepository: resources.faqRepository })
		app.register(getEntry, { faqRepository: resources.faqRepository })
		app.register(listEntries, { faqRepository: resources.faqRepository })
		app.register(deleteEntry, { faqRepository: resources.faqRepository })
	}
)
