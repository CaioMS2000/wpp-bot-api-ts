import { SenderType } from '@/@types'
import { Message } from '@/entities/message'
import { logger } from '@/logger'
import { Message as PrismaMessage } from '@prisma/client'
import { toPrismaFromType } from '../utils/enumTypeMapping'

export class MessageMapper {
	static toEntity(raw: PrismaMessage): Message {
		switch (raw.from) {
			case 'AI': {
				if (!raw.aiResponseId) {
					logger.error(
						'[MessageMapper.toEntity] AI message without aiResponseId',
						{ raw }
					)
					throw new Error('AI message without aiResponseId')
				}

				return Message.create(
					{
						conversationId: raw.conversationId,
						timestamp: raw.timestamp,
						senderType: SenderType.AI,
						content: raw.content,
						aiResponseId: raw.aiResponseId,
					},
					raw.id
				)
			}

			case 'SYSTEM': {
				return Message.create(
					{
						conversationId: raw.conversationId,
						timestamp: raw.timestamp,
						senderType: SenderType.SYSTEM,
						content: raw.content,
					},
					raw.id
				)
			}

			case 'CLIENT': {
				if (!raw.clientId) {
					logger.error(
						'[MessageMapper.toEntity] CLIENT message without clientId',
						{ raw }
					)
					throw new Error('CLIENT message without clientId')
				}
				return Message.create(
					{
						conversationId: raw.conversationId,
						timestamp: raw.timestamp,
						senderType: SenderType.CLIENT,
						content: raw.content,
						senderId: raw.clientId,
					},
					raw.id
				)
			}

			case 'EMPLOYEE': {
				if (!raw.employeeId) {
					logger.error(
						'[MessageMapper.toEntity] EMPLOYEE message without employeeId',
						{ raw }
					)
					throw new Error('EMPLOYEE message without employeeId')
				}
				return Message.create(
					{
						conversationId: raw.conversationId,
						timestamp: raw.timestamp,
						senderType: SenderType.EMPLOYEE,
						content: raw.content,
						senderId: raw.employeeId,
					},
					raw.id
				)
			}

			default: {
				logger.error('[MessageMapper.toEntity] Unknown message origin', { raw })
				throw new Error('Cannot resolve message origin')
			}
		}
	}

	static toModel(entity: Message): PrismaMessage {
		let aux = 'dono não detectado'
		let clientId: string | null = null
		let employeeId: string | null = null

		if (entity.senderType === SenderType.EMPLOYEE) {
			// É um Employee
			aux = 'mensagem de: EMPLOYEE'
			employeeId = entity.senderId
		} else {
			// É um Client
			aux = 'mensagem de: CLIENT'
			clientId = entity.senderId
		}

		const model = {
			id: entity.id,
			content: entity.content,
			from: toPrismaFromType(entity.senderType),
			timestamp: entity.timestamp,
			conversationId: entity.conversationId,
			aiResponseId: entity.aiResponseId,
			clientId,
			employeeId,
		}

		return model
	}
}
