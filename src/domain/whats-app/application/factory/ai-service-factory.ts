import { AIResponseService } from '@/infra/openai/services/response-service'
import { AIService } from '../services/ai-service'
import { RepositoryFactory } from './repository-factory'
import { UseCaseFactory } from './use-case-factory'

export interface AIServiceFactoryDependencies {
	repositoryFactory: RepositoryFactory
	useCaseFactory: UseCaseFactory
}

export class AIServiceFactory {
	private _dependencies: AIServiceFactoryDependencies
	constructor(dependencies: AIServiceFactoryDependencies) {
		this._dependencies = dependencies
	}

	createService(): AIService {
		return new AIResponseService(
			this.dependencies.repositoryFactory.getConversationRepository(),
			this.dependencies.useCaseFactory.getGetClientUseCase(),
			this.dependencies.useCaseFactory.getGetEmployeeUseCase()
		)
	}

	get dependencies() {
		return this._dependencies
	}
}
