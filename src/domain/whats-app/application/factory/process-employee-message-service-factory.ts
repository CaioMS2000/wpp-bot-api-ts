import { ProcessEmployeeMessageService } from '../services/process-employee-message-service'
import { RepositoryFactory } from './repository-factory'
import { UseCaseFactory } from './use-case-factory'
import { StateServiceFactory } from './state-service-factory'

export class ProcessEmployeeMessageServiceFactory {
	constructor(
		private repositoryFactory: RepositoryFactory,
		private useCaseFactory: UseCaseFactory,
		private stateServiceFactory: StateServiceFactory
	) {}

	getService() {
		const conversationRepository =
			this.repositoryFactory.getConversationRepository()
		const findConversationByEmployeePhoneUseCase =
			this.useCaseFactory.getFindConversationByEmployeePhoneUseCase()
		const createConversationUseCase =
			this.useCaseFactory.getCreateConversationUseCase()
		return new ProcessEmployeeMessageService(
			this.stateServiceFactory.getService(),
			conversationRepository,
			findConversationByEmployeePhoneUseCase,
			createConversationUseCase
		)
	}
}
