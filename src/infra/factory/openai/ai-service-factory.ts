import { AIResponseService } from '@/infra/openai/services/response-service'
import { AIService } from '../../../modules/whats-app/services/ai-service'
import { ConversationServiceFactory } from '@/modules/whats-app/factory/conversation-service-factory'
import { UserServiceFactory } from '@/modules/whats-app/factory/user-service-factory'

export class AIServiceFactory {
	constructor(
		private conversationServiceFactory: ConversationServiceFactory,
		private userServiceFactory: UserServiceFactory
	) {}

	createService(): AIService {
		return new AIResponseService(
			this.conversationServiceFactory.getService(),
			this.userServiceFactory.getService()
		)
	}
}
