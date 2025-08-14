import { z } from 'zod'
import { businessHoursSchema, chatMessageSchema, faqSchema } from './schemas'

export type BusinessHoursType = z.infer<typeof businessHoursSchema>

export type ChatMessage = z.infer<typeof chatMessageSchema>

export type CompanyType = {
	cnpj: string
	name: string
	phone: string
	managerId: string
	email?: Nullable<string>
	website?: Nullable<string>
	description?: Nullable<string>
	businessHours?: BusinessHoursType
}

export type FAQs = z.infer<typeof faqSchema>
