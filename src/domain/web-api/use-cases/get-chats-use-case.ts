import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { ParseChatUseCase } from './parse-chat-use-case'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { Client } from '@/domain/entities/client'

export class GetChatsUseCase {
	constructor(
		private conversationRepository: ConversationRepository,
		private departmentRepository: DepartmentRepository,
		private clientRepository: ClientRepository,
		private parseChatUseCase: ParseChatUseCase
	) {}

	async execute(companyId: string) {
		const allCompanyDepartments =
			await this.departmentRepository.findAll(companyId)
		const ids = [...new Set(allCompanyDepartments.flatMap(d => d.queue))]
		const clientsInQueue = await Promise.all(
			ids.map(id => this.clientRepository.findOrThrow(companyId, id))
		)
		const conversations =
			await this.conversationRepository.findAllBelongingToClient(companyId)

		const chats = await Promise.all(
			conversations.map(conversation =>
				this.parseChatUseCase.execute(conversation.companyId, conversation.id)
			)
		)
		return { chats, clientsInQueue }
	}
}
