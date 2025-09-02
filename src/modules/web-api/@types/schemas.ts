import { z } from 'zod'

export const businessHoursSchema = z
	.array(
		z.object({
			dayOfWeek: z.enum([
				'sunday',
				'monday',
				'tuesday',
				'wednesday',
				'thursday',
				'friday',
				'saturday',
			]),
			open: z
				.string()
				.regex(/^\d{1,2}:\d{1,2}$/)
				.transform(val => {
					const [h, m] = val.split(':')
					return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
				}),
			close: z
				.string()
				.regex(/^\d{1,2}:\d{1,2}$/)
				.transform(val => {
					const [h, m] = val.split(':')
					return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
				}),
		})
	)
	.length(7)
	.optional()

export const chatMessageSchema = z.discriminatedUnion('sender', [
	z.object({
		content: z.string().nullable(),
		sender: z.literal('client'),
		senderName: z.string(),
		timestamp: z.date(),
	}),
	z.object({
		content: z.string().nullable(),
		sender: z.literal('employee'),
		senderName: z.string(),
		timestamp: z.date(),
	}),
	z.object({
		content: z.string().nullable(),
		sender: z.literal('ai'),
		senderName: z.literal('AI'),
		timestamp: z.date(),
	}),
	z.object({
		content: z.string().nullable(),
		sender: z.literal('system'),
		senderName: z.literal('SYSTEM'),
		timestamp: z.date(),
	}),
])

export const faqSchema = z.array(
	z.object({
		id: z.string(),
		name: z.string(),
		items: z.array(
			z.object({
				id: z.string(),
				question: z.string(),
				answer: z.string(),
			})
		),
	})
)

export const departmentSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
})
