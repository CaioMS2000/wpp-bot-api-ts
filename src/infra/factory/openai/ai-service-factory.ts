import { AIResponseService } from '@/infra/openai/services/response-service'
import { ConversationServiceFactory } from '@/modules/whats-app/factory/conversation-service-factory'
import { UserServiceFactory } from '@/modules/whats-app/factory/user-service-factory'
import { AIService } from '../../../modules/whats-app/services/ai-service'
import { AIServiceFactory } from '@/modules/whats-app/factory/ai-service-factory'

export class OpenAIServiceFactory implements AIServiceFactory {
	constructor(
		private conversationServiceFactory: ConversationServiceFactory,
		private userServiceFactory: UserServiceFactory
	) {}

	getService(): AIService {
		return new AIResponseService(
			this.conversationServiceFactory.getService(),
			this.userServiceFactory.getService()
		)
	}
}
