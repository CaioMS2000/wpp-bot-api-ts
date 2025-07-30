import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByClientPhoneUseCase } from '../use-cases/find-conversation-by-client-phone-use-case'
import { FindConversationByEmployeePhoneUseCase } from '../use-cases/find-conversation-by-employee-phone-use-case'
import { FindEmployeeByPhoneUseCase } from '../use-cases/find-employee-by-phone-use-case'
import { FindOrCreateClientUseCase } from '../use-cases/find-or-create-client-use-case'
import { FinishClientAndEmployeeChatUseCase } from '../use-cases/finish-client-and-employee-chat'
import { GetClientUseCase } from '../use-cases/get-client-use-case'
import { GetCompanyUseCase } from '../use-cases/get-company-use-case'
import { GetDepartmentByNameUseCase } from '../use-cases/get-department-by-name-use-case'
import { GetEmployeeUseCase } from '../use-cases/get-employee-use-case'
import { InsertClientIntoDepartmentQueue } from '../use-cases/insert-client-into-department-queue'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { RemoveClientFromDepartmentQueue } from '../use-cases/remove-client-from-department-queue'
import { ResolveSenderContextUseCase } from '../use-cases/resolve-sender-context-use-case'
import { StartNextClientConversationUseCase } from '../use-cases/start-next-client-conversation-use-case'
import { TransferEmployeeToClientConversationUseCase } from '../use-cases/transfer-employee-to-client-conversation-use-case'
import { DepartmentQueueServiceFactory } from './department-queue-service-factory'
import { RepositoryFactory } from './repository-factory'
import type { StateFactory } from './state-factory'
import { GetClientByPhoneUseCase } from '../use-cases/get-client-by-phone-use-case'
import { GetFAQCategoryUseCase } from '../use-cases/get-faq-category-use-case'
import { GetFAQItemsUseCase } from '../use-cases/get-faq-items-use-case'
import { GetDepartmentUseCase } from '../use-cases/get-department-use-case'
import { DepartmentServiceFactory } from './department-service-factory'

export interface UseCaseFactoryDependencies {
	repositoryFactory: RepositoryFactory
	stateFactory: StateFactory
	departmentQueueServiceFactory: DepartmentQueueServiceFactory
	departmentServiceFactory: DepartmentServiceFactory
}

export class UseCaseFactory {
	constructor(private dependencies: UseCaseFactoryDependencies) {}

	getListActiveDepartmentsUseCase(): ListActiveDepartmentsUseCase {
		return new ListActiveDepartmentsUseCase(
			this.dependencies.repositoryFactory.getDepartmentRepository()
		)
	}

	getListFAQCategoriesUseCase(): ListFAQCategoriesUseCase {
		return new ListFAQCategoriesUseCase(
			this.dependencies.repositoryFactory.getFAQRepository()
		)
	}

	getListFAQCategorieItemsUseCase(): ListFAQCategorieItemsUseCase {
		return new ListFAQCategorieItemsUseCase(
			this.dependencies.repositoryFactory.getFAQRepository()
		)
	}

	getFindOrCreateClientUseCase(): FindOrCreateClientUseCase {
		return new FindOrCreateClientUseCase(
			this.dependencies.repositoryFactory.getClientRepository()
		)
	}

	getFindEmployeeByPhoneUseCase(): FindEmployeeByPhoneUseCase {
		return new FindEmployeeByPhoneUseCase(
			this.dependencies.repositoryFactory.getEmployeeRepository()
		)
	}

	getFindConversationByEmployeePhoneUseCase(): FindConversationByEmployeePhoneUseCase {
		return new FindConversationByEmployeePhoneUseCase(
			this.dependencies.repositoryFactory.getConversationRepository()
		)
	}

	getCreateConversationUseCase(): CreateConversationUseCase {
		return new CreateConversationUseCase(
			this.dependencies.repositoryFactory.getConversationRepository(),
			this.dependencies.repositoryFactory.getClientRepository(),
			this.dependencies.repositoryFactory.getEmployeeRepository(),
			this.dependencies.repositoryFactory.getCompanyRepository(),
			this.dependencies.stateFactory
		)
	}

	getResolveSenderContextUseCase(): ResolveSenderContextUseCase {
		return new ResolveSenderContextUseCase(
			this.dependencies.repositoryFactory.getCompanyRepository(),
			this.getFindEmployeeByPhoneUseCase(),
			this.getFindOrCreateClientUseCase()
		)
	}

	getTransferEmployeeToClientConversationUseCase(): TransferEmployeeToClientConversationUseCase {
		return new TransferEmployeeToClientConversationUseCase(
			this.dependencies.repositoryFactory.getConversationRepository(),
			this.dependencies.stateFactory,
			this.getGetClientUseCase()
		)
	}

	getFindConversationByClientPhoneUseCase(): FindConversationByClientPhoneUseCase {
		return new FindConversationByClientPhoneUseCase(
			this.dependencies.repositoryFactory.getConversationRepository()
		)
	}

	getInsertClientIntoDepartmentQueue(): InsertClientIntoDepartmentQueue {
		return new InsertClientIntoDepartmentQueue(
			this.dependencies.repositoryFactory.getDepartmentRepository()
		)
	}

	getRemoveClientFromDepartmentQueue(): RemoveClientFromDepartmentQueue {
		return new RemoveClientFromDepartmentQueue(
			this.dependencies.repositoryFactory.getDepartmentRepository()
		)
	}

	getFinishClientAndEmployeeChatUseCase(): FinishClientAndEmployeeChatUseCase {
		return new FinishClientAndEmployeeChatUseCase(
			this.dependencies.repositoryFactory.getConversationRepository(),
			this.dependencies.stateFactory
		)
	}

	getStartNextClientConversationUseCase(): StartNextClientConversationUseCase {
		return new StartNextClientConversationUseCase(
			this.dependencies.stateFactory,
			this.dependencies.departmentQueueServiceFactory.getService(),
			this.dependencies.repositoryFactory.getConversationRepository(),
			this.dependencies.repositoryFactory.getDepartmentRepository(),
			this.getTransferEmployeeToClientConversationUseCase(),
			this.dependencies.departmentServiceFactory.getService()
		)
	}

	getGetCompanyUseCase(): GetCompanyUseCase {
		return new GetCompanyUseCase(
			this.dependencies.repositoryFactory.getCompanyRepository()
		)
	}

	getGetEmployeeUseCase(): GetEmployeeUseCase {
		return new GetEmployeeUseCase(
			this.dependencies.repositoryFactory.getEmployeeRepository()
		)
	}

	getGetClientUseCase(): GetClientUseCase {
		return new GetClientUseCase(
			this.dependencies.repositoryFactory.getClientRepository()
		)
	}

	getGetClientByPhoneUseCase(): GetClientByPhoneUseCase {
		return new GetClientByPhoneUseCase(
			this.dependencies.repositoryFactory.getClientRepository()
		)
	}

	getGetDepartmentByNameUseCase(): GetDepartmentByNameUseCase {
		return new GetDepartmentByNameUseCase(
			this.dependencies.repositoryFactory.getDepartmentRepository()
		)
	}

	getGetFAQCategoryUseCase(): GetFAQCategoryUseCase {
		return new GetFAQCategoryUseCase(
			this.dependencies.repositoryFactory.getFAQRepository()
		)
	}

	getGetFAQItemsUseCase(): GetFAQItemsUseCase {
		return new GetFAQItemsUseCase(
			this.dependencies.repositoryFactory.getFAQRepository()
		)
	}

	getGetDepartmentUseCase(): GetDepartmentUseCase {
		return new GetDepartmentUseCase(
			this.dependencies.repositoryFactory.getDepartmentRepository()
		)
	}
}
