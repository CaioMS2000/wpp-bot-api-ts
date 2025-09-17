import { z } from 'zod'

export const paramsByCnpj = z.object({ cnpj: z.string().min(1) })

export const listQuery = z.object({
	limit: z.coerce.number().int().min(1).max(200).default(50),
})

const convMessage = z.object({
	sender: z.enum(['EMPLOYEE', 'CUSTOMER']),
	name: z.string(),
	text: z.string(),
	createdAt: z.string().datetime(),
})

const conversationItem = z.object({
	kind: z.literal('CONVERSATION'),
	id: z.string(),
	startedAt: z.string().datetime(),
	endedAt: z.string().datetime().nullable(),
	active: z.boolean(),
	resolution: z.enum(['RESOLVED', 'UNRESOLVED']).nullable(),
	employeeName: z.string(),
	employeePhone: z.string(),
	departmentName: z.string().nullable(),
	customerPhone: z.string(),
	customerName: z.string(),
	queued: z.boolean(),
	finalSummary: z.string().nullable().optional(),
	messages: z.array(convMessage),
})

const aiMessage = z.object({
	sender: z.enum(['AI', 'USER']),
	name: z.string(),
	text: z.string(),
	createdAt: z.string().datetime(),
})

const aiItem = z.object({
	kind: z.literal('AI'),
	id: z.string(),
	startedAt: z.string().datetime(),
	endedAt: z.string().datetime().nullable(),
	endReason: z.string().nullable(),
	customerPhone: z.string(),
	customerName: z.string(),
	conversationId: z.string().nullable(),
	finalSummary: z.string().nullable().optional(),
	messages: z.array(aiMessage),
})

export const listResponse = {
	200: z.object({
		items: z.array(z.discriminatedUnion('kind', [conversationItem, aiItem])),
	}),
}
