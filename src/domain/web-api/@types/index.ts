import { Company } from '@/domain/entities/company'
import { z } from 'zod'
import { businessHoursSchema, createEmployeeSchema } from './schemas'

export type BusinessHoursType = z.infer<typeof businessHoursSchema>

export type CompanyType = Omit<
	Parameters<typeof Company.create>[0],
	'businessHours'
> & {
	businessHours: BusinessHoursType
}

export type ChatMessage =
	| {
			content: string
			sender: 'client' | 'employee'
			senderName: string
			timestamp: Date
	  }
	| {
			content: string
			sender: 'ai'
			senderName: 'AI'
			timestamp: Date
	  }

export type FAQs = Record<
	string,
	{
		question: string
		answer: string
	}[]
>

export type CreateEmployeeType = z.infer<typeof createEmployeeSchema>
