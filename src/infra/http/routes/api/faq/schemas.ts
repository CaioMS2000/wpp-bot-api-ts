import { z } from 'zod'

export const paramsByCnpj = z.object({ cnpj: z.string().min(1) })
export const idParam = z.object({ id: z.string().min(1) })

// Category
export const categoryCreateBody = z.object({ name: z.string().min(1) })
export const categoryUpdateBody = z.object({
	name: z.string().min(1).optional(),
})
export const category = z.object({ id: z.string(), name: z.string() })
export const categoryResponse = { 200: category }
export const categoryListResponse = {
	200: z.object({ items: z.array(category) }),
}

// Entry
export const entryCreateBody = z.object({
	categoryId: z.string().min(1),
	question: z.string().min(1),
	answer: z.string().min(1),
})
export const entryUpdateBody = z.object({
	categoryId: z.string().min(1).optional(),
	question: z.string().min(1).optional(),
	answer: z.string().min(1).optional(),
})
export const entry = z.object({
	id: z.string(),
	question: z.string(),
	answer: z.string(),
	categoryId: z.string(),
})
export const entryResponse = { 200: entry }
export const entryListResponse = { 200: z.object({ items: z.array(entry) }) }
