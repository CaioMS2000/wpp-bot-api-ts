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
import { GetDepartmentEmployeeUseCase } from '../use-cases/get-department-employee'
import { GetFAQCategoryUseCase } from '../use-cases/get-faq-category-use-case'
import { GetFAQItemsUseCase } from '../use-cases/get-faq-items-use-case'
import { GetDepartmentUseCase } from '../use-cases/get-department-use-case'

export class UseCaseFactory {
	constructor(
		private repositoryFactory: RepositoryFactory,
		private stateFactory: StateFactory,
		private departmentQueueServiceFactory: DepartmentQueueServiceFactory
	) {}

	getListActiveDepartmentsUseCase(): ListActiveDepartmentsUseCase {
		return new ListActiveDepartmentsUseCase(
			this.repositoryFactory.getDepartmentRepository()
		)
	}

	getListFAQCategoriesUseCase(): ListFAQCategoriesUseCase {
		return new ListFAQCategoriesUseCase(
			this.repositoryFactory.getFAQRepository()
		)
	}

	getListFAQCategorieItemsUseCase(): ListFAQCategorieItemsUseCase {
		return new ListFAQCategorieItemsUseCase(
			this.repositoryFactory.getFAQRepository()
		)
	}

	getFindOrCreateClientUseCase(): FindOrCreateClientUseCase {
		return new FindOrCreateClientUseCase(
			this.repositoryFactory.getClientRepository()
		)
	}

	getFindEmployeeByPhoneUseCase(): FindEmployeeByPhoneUseCase {
		return new FindEmployeeByPhoneUseCase(
			this.repositoryFactory.getEmployeeRepository()
		)
	}

	getFindConversationByEmployeePhoneUseCase(): FindConversationByEmployeePhoneUseCase {
		return new FindConversationByEmployeePhoneUseCase(
			this.repositoryFactory.getConversationRepository()
		)
	}

	getCreateConversationUseCase(): CreateConversationUseCase {
		return new CreateConversationUseCase(
			this.repositoryFactory.getConversationRepository(),
			this.repositoryFactory.getClientRepository(),
			this.repositoryFactory.getEmployeeRepository(),
			this.repositoryFactory.getCompanyRepository(),
			this.stateFactory
		)
	}

	getResolveSenderContextUseCase(): ResolveSenderContextUseCase {
		return new ResolveSenderContextUseCase(
			this.repositoryFactory.getCompanyRepository(),
			this.getFindEmployeeByPhoneUseCase(),
			this.getFindOrCreateClientUseCase()
		)
	}

	getTransferEmployeeToClientConversationUseCase(): TransferEmployeeToClientConversationUseCase {
		return new TransferEmployeeToClientConversationUseCase(
			this.repositoryFactory.getConversationRepository(),
			this.stateFactory,
			this.getGetClientUseCase()
		)
	}

	getFindConversationByClientPhoneUseCase(): FindConversationByClientPhoneUseCase {
		return new FindConversationByClientPhoneUseCase(
			this.repositoryFactory.getConversationRepository()
		)
	}

	getInsertClientIntoDepartmentQueue(): InsertClientIntoDepartmentQueue {
		return new InsertClientIntoDepartmentQueue(
			this.repositoryFactory.getDepartmentRepository()
		)
	}

	getRemoveClientFromDepartmentQueue(): RemoveClientFromDepartmentQueue {
		return new RemoveClientFromDepartmentQueue(
			this.repositoryFactory.getDepartmentRepository()
		)
	}

	getFinishClientAndEmployeeChatUseCase(): FinishClientAndEmployeeChatUseCase {
		return new FinishClientAndEmployeeChatUseCase(
			this.repositoryFactory.getConversationRepository(),
			this.stateFactory
		)
	}

	getStartNextClientConversationUseCase(): StartNextClientConversationUseCase {
		return new StartNextClientConversationUseCase(
			this.stateFactory,
			this.departmentQueueServiceFactory.getService(),
			this.repositoryFactory.getConversationRepository(),
			this.repositoryFactory.getDepartmentRepository(),
			this.getTransferEmployeeToClientConversationUseCase(),
			this.getGetDepartmentEmployeeUseCase()
		)
	}

	getGetCompanyUseCase(): GetCompanyUseCase {
		return new GetCompanyUseCase(this.repositoryFactory.getCompanyRepository())
	}

	getGetEmployeeUseCase(): GetEmployeeUseCase {
		return new GetEmployeeUseCase(
			this.repositoryFactory.getEmployeeRepository()
		)
	}

	getGetClientUseCase(): GetClientUseCase {
		return new GetClientUseCase(this.repositoryFactory.getClientRepository())
	}

	getGetClientByPhoneUseCase(): GetClientByPhoneUseCase {
		return new GetClientByPhoneUseCase(
			this.repositoryFactory.getClientRepository()
		)
	}

	getGetDepartmentByNameUseCase(): GetDepartmentByNameUseCase {
		return new GetDepartmentByNameUseCase(
			this.repositoryFactory.getDepartmentRepository()
		)
	}

	getGetFAQCategoryUseCase(): GetFAQCategoryUseCase {
		return new GetFAQCategoryUseCase(this.repositoryFactory.getFAQRepository())
	}

	getGetFAQItemsUseCase(): GetFAQItemsUseCase {
		return new GetFAQItemsUseCase(this.repositoryFactory.getFAQRepository())
	}

	getGetDepartmentEmployeeUseCase(): GetDepartmentEmployeeUseCase {
		return new GetDepartmentEmployeeUseCase(
			this.repositoryFactory.getDepartmentRepository(),
			this.repositoryFactory.getEmployeeRepository()
		)
	}

	getGetDepartmentUseCase(): GetDepartmentUseCase {
		return new GetDepartmentUseCase(
			this.repositoryFactory.getDepartmentRepository()
		)
	}
}
