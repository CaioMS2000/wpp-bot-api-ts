import { SenderType, UserType } from '@/@types'
import { Client } from '@/entities/client'
import { Company } from '@/entities/company'
import { Conversation } from '@/entities/conversation'
import { Message } from '@/entities/message'
import { FileTooLargeError } from '@/errors/errors/file-too-large-error'
import { UnsupportedFileTypeError } from '@/errors/errors/unsupported-file-type-error'
import { UnsupportedMessageTypeError } from '@/errors/errors/unsupported-message-type-error'
import { logger } from '@/logger'
import { ConversationStateType } from '@/states'
import { WppIncomingContent } from '../@types/messages'
import { ClientAlreadyInQueueError } from '../errors/client-already-in-queue'
import { InvalidMenuOptionError } from '../errors/invalid-menu-option'
import { StateAccessDeniedError } from '../errors/state-access-denied'
import { ConversationService } from './conversation-service'
import { ConversationStateOrchestrator } from './state-orchestrator'

export class ProcessClientMessageService {
	constructor(
		private conversationService: ConversationService,
		private orchestrator: ConversationStateOrchestrator
	) {}

	async process(
		company: Company,
		user: Client,
		messageContent: WppIncomingContent,
		name?: string
	) {
		try {
			const conversation = await this.getOrCreateConversation(company, user)

			const newMessage = await this.saveMessage(
				conversation,
				user,
				messageContent
			)

			await this.orchestrator.handle({
				company,
				user,
				userType: UserType.CLIENT,
				conversation,
				message: newMessage,
				wppIncomingContent: messageContent,
			})
		} catch (error) {
			logger.error('Error processing client message:\n', error)
			const output = this.orchestrator.getOutputPort()
			if (
				error instanceof UnsupportedMessageTypeError ||
				error instanceof UnsupportedFileTypeError
			) {
				return await output.handle(user, {
					type: 'text',
					content: 'Não suportamos esse tipo de arquivo, envie apenas PDF',
				})
			} else if (error instanceof FileTooLargeError) {
				return await output.handle(user, {
					type: 'text',
					content: 'Arquivo muito grande, tente um arquivo menor',
				})
			} else if (error instanceof InvalidMenuOptionError) {
				return await output.handle(user, {
					type: 'text',
					content: 'Opção não identificada, tente de novo',
				})
			} else if (error instanceof StateAccessDeniedError) {
				return await output.handle(user, {
					type: 'text',
					content: 'Ação não permitida para seu perfil',
				})
			} else if (error instanceof ClientAlreadyInQueueError) {
				return await output.handle(user, {
					type: 'text',
					content: 'Você já está na fila de atendimento',
				})
			}
			throw error
		}
	}

	private async saveMessage(
		conversation: Conversation,
		sender: Client,
		content: WppIncomingContent
	): Promise<Message> {
		let message: Message

		switch (content.kind) {
			case 'text': {
				message = Message.create({
					conversationId: conversation.id,
					senderId: sender.id,
					content: content.text,
					senderType: SenderType.CLIENT,
				})
				break
			}
			case 'button_reply':
			case 'list_reply': {
				message = Message.create({
					conversationId: conversation.id,
					senderId: sender.id,
					content: content.title,
					senderType: SenderType.CLIENT,
				})
				break
			}
			case 'document': {
				message = Message.create({
					conversationId: conversation.id,
					senderId: sender.id,
					content: content.caption ?? null,
					senderType: SenderType.CLIENT,
					mediaId: content.media.id,
				})
				break
			}
			case 'audio': {
				message = Message.create({
					conversationId: conversation.id,
					senderId: sender.id,
					content: null,
					senderType: SenderType.CLIENT,
					mediaId: content.media.id,
				})
				break
			}
			// case 'image': {
			// 	break
			// }
			// case 'video': {
			// 	break
			// }
			// case 'sticker': {
			// 	break
			// }
			default: {
				throw new UnsupportedMessageTypeError(
					`This kind(${content.kind}) of message is not supported yet.`
				)
			}
		}

		conversation.messages.push(message)
		await this.conversationService.save(conversation)

		return message
	}

	private async getOrCreateConversation(
		company: Company,
		user: Client
	): Promise<Conversation> {
		let conversation = await this.conversationService.findActiveForClient(
			company.id,
			user
		)

		if (!conversation) {
			conversation = await this.conversationService.createConversation({
				userId: user.id,
				companyId: company.id,
				userType: UserType.CLIENT,
				state: ConversationStateType.BEGIN,
			})
		}

		return conversation
	}
}
