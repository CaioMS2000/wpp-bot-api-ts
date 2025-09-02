import { SenderType } from '@/@types'
import { Entity } from '@/entities/entity'

export type MessageProps = {
	conversationId: string
	timestamp: Date
	content: Nullable<string>
	aiResponseId: Nullable<string>
	senderType: SenderType
	senderId: Nullable<string>
	mediaId: Nullable<string>
}

type CreateMessageInputCommon = RequireOnly<
	MessageProps,
	'conversationId' | 'senderType' | 'content'
>

type CreateMessageInputBySender =
	| {
			senderType: SenderType.AI
			aiResponseId: string
			senderId?: never
	  }
	| {
			senderType: SenderType.CLIENT
			senderId: string
			aiResponseId?: never
	  }
	| {
			senderType: SenderType.EMPLOYEE
			senderId: string
			aiResponseId?: never
	  }
	| {
			senderType: SenderType.SYSTEM
			senderId?: never
			aiResponseId?: never
	  }

export type CreateMessageInput = CreateMessageInputCommon &
	CreateMessageInputBySender

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
			mediaId: null,
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

	get mediaId() {
		return this.props.mediaId
	}
}
