import { User } from '@/@types'
import { Company } from '@/entities/company'
import { WppIncomingContent } from '../@types/messages'

export abstract class MessageHandler {
	abstract process(
		company: Company,
		user: User,
		messageContent: WppIncomingContent,
		name?: string
	): Promise<void>
}
