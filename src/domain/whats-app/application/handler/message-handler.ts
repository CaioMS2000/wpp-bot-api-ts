import { Company } from '@/domain/entities/company'
import { User } from '../../@types'

export abstract class MessageHandler {
	abstract process(
		company: Company,
		user: User,
		messageContent: string,
		name?: string
	): Promise<void>
}
