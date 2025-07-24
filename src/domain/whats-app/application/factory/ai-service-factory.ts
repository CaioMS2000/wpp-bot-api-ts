import { AIResponseService } from '@/infra/openai/services/response-service'
import { AIService } from '../services/ai-service'
import { RepositoryFactory } from './repository-factory'
import { UseCaseFactory } from './use-case-factory'

export class AIServiceFactory {
	private repositoryFactory: RepositoryFactory
	private useCaseFactory: UseCaseFactory
	constructor() {
		this.repositoryFactory = null as unknown as RepositoryFactory
		this.useCaseFactory = null as unknown as UseCaseFactory
	}

	setRepositoryFactory(repositoryFactory: RepositoryFactory) {
		this.repositoryFactory = repositoryFactory
	}
	setUseCaseFactory(useCaseFactory: UseCaseFactory) {
		this.useCaseFactory = useCaseFactory
	}

	createService(): AIService {
		return new AIResponseService(
			this.repositoryFactory.getConversationRepository(),
			this.useCaseFactory.getGetClientUseCase(),
			this.useCaseFactory.getGetEmployeeUseCase()
		)
	}
}
