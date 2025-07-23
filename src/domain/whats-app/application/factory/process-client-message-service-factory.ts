import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { ProcessClientMessageService } from '../services/process-client-message-service'
import { StateServiceFactory } from './state-service-factory'

export class ProcessClientMessageServiceFactory {
	constructor(
		private repositoryFactory: RepositoryFactory,
		private useCaseFactory: UseCaseFactory,
		private stateServiceFactory: StateServiceFactory
	) {}

	getService() {
		const conversationRepository =
			this.repositoryFactory.getConversationRepository()
		const createConversationUseCase =
			this.useCaseFactory.getCreateConversationUseCase()
		const findConversationByClientPhoneUseCase =
			this.useCaseFactory.getFindConversationByClientPhoneUseCase()

		return new ProcessClientMessageService(
			conversationRepository,
			createConversationUseCase,
			findConversationByClientPhoneUseCase,
			this.stateServiceFactory.getService()
		)
	}
}
