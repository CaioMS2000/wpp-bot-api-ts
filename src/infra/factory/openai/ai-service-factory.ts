import { AIResponseService } from '@/infra/openai/services/response-service'
import { AIServiceFactory } from '@/modules/whats-app/factory/ai-service-factory'
import { CompanyServiceFactory } from '@/modules/whats-app/factory/company-service-factory'
import { ConversationServiceFactory } from '@/modules/whats-app/factory/conversation-service-factory'
import { UserServiceFactory } from '@/modules/whats-app/factory/user-service-factory'
import { WhatsAppMediaService } from '@/modules/whats-app/services/whatsapp-media-service'
import { AIService } from '../../../modules/whats-app/services/ai-service'

export class OpenAIServiceFactory implements AIServiceFactory {
	constructor(
		private conversationServiceFactory: ConversationServiceFactory,
		private userServiceFactory: UserServiceFactory,
		private companyServiceFactory: CompanyServiceFactory,
		private whatsAppMediaService: WhatsAppMediaService
	) {}

	getService(): AIService {
		return new AIResponseService(
			this.conversationServiceFactory.getService(),
			this.userServiceFactory.getService(),
			this.companyServiceFactory.getService(),
			this.whatsAppMediaService
		)
	}
}
