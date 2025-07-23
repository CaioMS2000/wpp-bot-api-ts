import { AIResponseService } from '@/infra/openai/services/response-service'
import { AIService } from '../services/ai-service'
import { RepositoryFactory } from './repository-factory'

export class AIServiceFactory {
	private repositoryFactory: RepositoryFactory
	constructor() {
		this.repositoryFactory = null as unknown as RepositoryFactory
	}

	setRepositoryFactory(repositoryFactory: RepositoryFactory) {
		this.repositoryFactory = repositoryFactory
	}

	createService(): AIService {
		return new AIResponseService(
			this.repositoryFactory.getConversationRepository()
		)
	}
}
