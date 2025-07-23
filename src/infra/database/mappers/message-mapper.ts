import { Message } from '@/domain/entities/message'
import { SenderType } from '@/domain/whats-app/@types'
import { Message as PrismaMessage } from 'ROOT/prisma/generated'
import { toPrismaFromType } from '../utils/enumTypeMapping'

export class MessageMapper {
	static toEntity(raw: PrismaMessage): Message {
		if (raw.from === 'AI' && raw.aiResponseId) {
			return Message.create(
				{
					conversationId: raw.conversationId,
					senderType: SenderType.AI,
					content: raw.content,
					aiResponseId: raw.aiResponseId,
				},
				raw.id
			)
		} else if (raw.from !== 'AI' && (raw.clientId || raw.employeeId)) {
			let resolvedFrom: Nullable<Message['senderType']> = null
			let resolvedSenderId: Nullable<Message['senderId']> = null

			if (raw.from === 'CLIENT') {
				resolvedFrom = SenderType.CLIENT
				resolvedSenderId = raw.clientId
			} else if (raw.from === 'EMPLOYEE') {
				resolvedFrom = SenderType.EMPLOYEE
				resolvedSenderId = raw.employeeId
			}

			if (!resolvedFrom || !resolvedSenderId) {
				throw new Error('Cannot resolve message origin')
			}

			return Message.create(
				{
					senderType: resolvedFrom,
					content: raw.content,
					senderId: resolvedSenderId,
					conversationId: raw.conversationId,
				},
				raw.id
			)
		}
		throw new Error('Cannot resolve message from')
	}

	static toModel(entity: Message): Omit<PrismaMessage, 'id'> {
		let clientId: string | null = null
		let employeeId: string | null = null

		if (entity.senderType) {
			if (entity.senderType === SenderType.EMPLOYEE) {
				// É um Employee
				employeeId = entity.senderId
			} else {
				// É um Client
				clientId = entity.senderId
			}
		}

		return {
			content: entity.content,
			from: toPrismaFromType(entity.senderType),
			timestamp: entity.timestamp,
			conversationId: entity.conversationId,
			aiResponseId: entity.aiResponseId,
			clientId,
			employeeId,
		}
	}
}
