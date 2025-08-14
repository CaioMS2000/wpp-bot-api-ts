import { ConversationService } from '@/modules/whats-app/services/conversation-service'
import { DepartmentQueueService } from '@/modules/whats-app/services/department-queue-service'
import { DepartmentService } from '@/modules/whats-app/services/department-service'
import { ParseChatUseCase } from './parse-chat-use-case'

export class GetChatsUseCase {
	constructor(
		private conversationService: ConversationService,
		private departmentService: DepartmentService,
		private departmentQueueService: DepartmentQueueService,
		private parseChatUseCase: ParseChatUseCase
	) {}

	async execute(companyId: string) {
		const allCompanyDepartments =
			await this.departmentService.findAllDepartments(companyId)

		const clientIdsInQueue = new Set<string>()

		await Promise.all(
			allCompanyDepartments.map(async d => {
				const queue = await this.departmentQueueService.getQueue(
					companyId,
					d.id
				)
				queue.forEach(c => clientIdsInQueue.add(c.id))
			})
		)

		const conversations =
			await this.conversationService.getAllBelongingToClient(companyId)

		const chats = await Promise.all(
			conversations.map(conversation =>
				this.parseChatUseCase.execute(conversation.companyId, conversation.id)
			)
		)

		return { chats, clientsInQueue: clientIdsInQueue.size }
	}
}
