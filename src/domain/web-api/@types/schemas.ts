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

export const createCompanySchema = z.object({
	name: z.string(),
	phone: z.string(),
	cnpj: z.string(),
	email: z.string().optional(),
	website: z.string().optional(),
	description: z.string().optional(),
	businessHours: businessHoursSchema,
})

export const createEmployeeSchema = z.object({
	name: z.string(),
	phone: z.string(),
	departmentId: z.string().optional(),
})

export const authenticateBodySchema = z.object({
	email: z.string().email(),
	password: z.string().min(3),
})

export const registerBodySchema = z.object({
	email: z.string().email(),
	password: z.string().min(3),
	name: z.string().min(3),
	phone: z.string().optional().nullable().default(null),
})

export const chatSchema = z.object({})

export const createDepartmentSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().optional(),
})
