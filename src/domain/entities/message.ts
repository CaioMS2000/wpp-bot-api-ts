import { Entity } from '@/core/entities/entity'
import { SenderType } from '../whats-app/@types'

export type MessageProps = {
	conversationId: string
	timestamp: Date
	content: string
	aiResponseId: Nullable<string>
	senderType: SenderType
	senderId: Nullable<string>
}
export type CreateMessageInput = RequireOnly<
	MessageProps,
	'conversationId' | 'senderType' | 'content'
> & {
	// Quando from é 'AI', aiResponseId é obrigatório
	aiResponseId?: Nullable<string>
} & (
		| {
				senderType: SenderType.AI
				aiResponseId: string // Obrigatório para AI
		  }
		| {
				senderType: SenderType.CLIENT | SenderType.EMPLOYEE
				senderId: string
				aiResponseId?: never // Não permitido para outros tipos
		  }
	)

export class Message extends Entity<MessageProps> {
	static create(props: CreateMessageInput, id?: string) {
		// Validação específica para mensagens AI
		if (props.senderType === SenderType.AI && !props.aiResponseId) {
			throw new Error('AI messages must have an aiResponseId')
		}

		// Validação para evitar aiResponseId em mensagens não-AI
		if (props.senderType !== SenderType.AI && props.aiResponseId) {
			throw new Error('Only AI messages can have an aiResponseId')
		}
		const defaults: Omit<
			MessageProps,
			'conversationId' | 'senderType' | 'content'
		> = {
			timestamp: new Date(),
			aiResponseId:
				props.senderType === SenderType.AI ? props.aiResponseId : null,
			senderId: null,
		}
		const message = new Message(
			{
				...defaults,
				...props,
				aiResponseId:
					props.senderType === SenderType.AI ? props.aiResponseId! : null,
			},
			id
		)
		return message
	}

	get timestamp() {
		return this.props.timestamp
	}

	get senderType() {
		return this.props.senderType
	}

	get content() {
		return this.props.content
	}

	get senderId(): Nullable<string> {
		return this.props.senderId
	}

	get aiResponseId() {
		return this.props.aiResponseId
	}

	get conversationId() {
		return this.props.conversationId
	}
}
