import { Message } from '@/domain/entities/message'
import { SenderType } from '@/domain/whats-app/@types'
import { Message as PrismaMessage } from 'ROOT/prisma/generated'
import { toPrismaFromType } from '../utils/enumTypeMapping'
import { logger } from '@/core/logger'

export class MessageMapper {
	static toEntity(raw: PrismaMessage): Message {
		logger.debug('[MessageMapper.toEntity]\n', {
			raw,
		})
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

			if (resolvedFrom === null || resolvedSenderId === null) {
				logger.error('[MessageMapper.toEntity]\n', {
					raw,
					resolvedFrom,
					resolvedSenderId,
				})
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
		logger.debug(
			'[MessageMapper.toModel]\n',
			{
				aux,
				entity,
				model,
			},
			`\nalvo de comparação 'SenderType.EMPLOYEE': ${SenderType.EMPLOYEE}`
		)
		return model
	}
}
