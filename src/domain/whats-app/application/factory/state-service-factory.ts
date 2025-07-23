import { StateService } from '../services/state-service'
import { RepositoryFactory } from './repository-factory'
import { StateFactory } from './state-factory'
import { UseCaseFactory } from './use-case-factory'

export class StateServiceFactory {
	constructor(
		private repositoryFactory: RepositoryFactory,
		private useCaseFactory: UseCaseFactory,
		private stateFactory: StateFactory
	) {}

	getService() {
		return new StateService(
			this.stateFactory,
			this.repositoryFactory.getFAQRepository(),
			this.repositoryFactory.getConversationRepository(),
			this.repositoryFactory.getDepartmentRepository(),
			this.useCaseFactory.getGetClientUseCase(),
			this.useCaseFactory.getGetClientByPhoneUseCase(),
			this.useCaseFactory.getGetEmployeeUseCase(),
			this.useCaseFactory.getGetFAQCategoryUseCase(),
			this.useCaseFactory.getGetCompanyUseCase(),
			this.useCaseFactory.getGetDepartmentEmployeeUseCase()
		)
	}
}
