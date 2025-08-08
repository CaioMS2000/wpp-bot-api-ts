import { DepartmentServiceFactory } from '@/domain/whats-app/application/factory/department-service-factory'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { CreateCompanyUseCase } from '../use-cases/create-company-use-case'
import { CreateDepartmentUseCase } from '../use-cases/create-department-use-case'
import { CreateEmployeeUseCase } from '../use-cases/create-employee-use-case'
import { CreateFAQUseCase } from '../use-cases/create-faq-use-case'
import { GetAllCompanyEmployeesUseCase } from '../use-cases/get-all-company-employees-use-case'
import { GetBaseMetricsUseCase } from '../use-cases/get-base-metrics-use-case'
import { GetChatsUseCase } from '../use-cases/get-chats-use-case'
import { GetCompanyDepartmentsUseCase } from '../use-cases/get-company-departments-use-case'
import { GetCompanyUseCase } from '../use-cases/get-company-use-case'
import { GetDepartmentUseCase } from '../use-cases/get-department-use-case'
import { GetDepartmentsMetricsUseCase } from '../use-cases/get-departments-metrics-use-case'
import { GetEmployeeByPhoneUseCase } from '../use-cases/get-employee-by-phone-use-case'
import { GetFAQsUseCase } from '../use-cases/get-faqs-use-case'
import { GetManagerProfileUseCase } from '../use-cases/get-manager-profile-use-case'
import { GetRecentChatsUseCase } from '../use-cases/get-recent-chats-use-case'
import { GetWeekConversationsMetrics } from '../use-cases/get-week-conversations-metrics'
import { ParseChatUseCase } from '../use-cases/parse-chat-use-case'
import { UpdateCompanyUseCase } from '../use-cases/update-company-use-case'
import { UpdateDepartmentUseCase } from '../use-cases/update-department-use-case'
import { UpdateFAQItemUseCase } from '../use-cases/update-faq-item-use-case'
import { UpdateFAQCategoryNameUseCase } from '../use-cases/update-faq-category-name-use-case'
import { DeleteFAQItemUseCase } from '../use-cases/delete-faq-item-use-case'
import { DeleteFAQCategoryUseCase } from '../use-cases/delete-faq-category-use-case'

export class UseCaseFactory {
	constructor(
		private repositoryFactory: RepositoryFactory,
		private departmentServiceFactory: DepartmentServiceFactory
	) {}

	getCreateCompanyUseCase(): CreateCompanyUseCase {
		return new CreateCompanyUseCase(
			this.repositoryFactory.getCompanyRepository()
		)
	}

	getCreateEmployeeUseCase(): CreateEmployeeUseCase {
		return new CreateEmployeeUseCase(
			this.repositoryFactory.getEmployeeRepository(),
			this.repositoryFactory.getDepartmentRepository()
		)
	}

	getGetAllCompanyEmployeesUseCase(): GetAllCompanyEmployeesUseCase {
		return new GetAllCompanyEmployeesUseCase(
			this.repositoryFactory.getEmployeeRepository(),
			this.repositoryFactory.getConversationRepository(),
			this.repositoryFactory.getDepartmentRepository()
		)
	}

	getGetChatsUseCase(): GetChatsUseCase {
		return new GetChatsUseCase(
			this.repositoryFactory.getConversationRepository(),
			this.getParseChatUseCase()
		)
	}

	getGetCompanyDepartmentsUseCase(): GetCompanyDepartmentsUseCase {
		return new GetCompanyDepartmentsUseCase(
			this.repositoryFactory.getDepartmentRepository()
		)
	}

	getGetCompanyUseCase(): GetCompanyUseCase {
		return new GetCompanyUseCase(this.repositoryFactory.getCompanyRepository())
	}

	getGetDepartmentUseCase(): GetDepartmentUseCase {
		return new GetDepartmentUseCase(
			this.repositoryFactory.getDepartmentRepository(),
			this.departmentServiceFactory.getService()
		)
	}

	getGetEmployeeByPhoneUseCase(): GetEmployeeByPhoneUseCase {
		return new GetEmployeeByPhoneUseCase(
			this.repositoryFactory.getEmployeeRepository(),
			this.repositoryFactory.getDepartmentRepository()
		)
	}

	getGetFAQsUseCase(): GetFAQsUseCase {
		return new GetFAQsUseCase(this.repositoryFactory.getFAQRepository())
	}

	getGetManagerProfileUseCase(): GetManagerProfileUseCase {
		return new GetManagerProfileUseCase(
			this.repositoryFactory.getManagerRepository()
		)
	}

	getGetRecentChatsUseCase(): GetRecentChatsUseCase {
		return new GetRecentChatsUseCase(
			this.repositoryFactory.getConversationRepository(),
			this.getParseChatUseCase()
		)
	}

	getParseChatUseCase(): ParseChatUseCase {
		return new ParseChatUseCase(
			this.repositoryFactory.getClientRepository(),
			this.repositoryFactory.getEmployeeRepository(),
			this.repositoryFactory.getConversationRepository()
		)
	}

	getUpdateCompanyUseCase(): UpdateCompanyUseCase {
		return new UpdateCompanyUseCase(
			this.repositoryFactory.getCompanyRepository()
		)
	}

	getGetBaseMetricsUseCase(): GetBaseMetricsUseCase {
		return new GetBaseMetricsUseCase(
			this.repositoryFactory.getConversationRepository()
		)
	}

	getGetDepartmentsMetricsUseCase(): GetDepartmentsMetricsUseCase {
		return new GetDepartmentsMetricsUseCase(
			this.repositoryFactory.getConversationRepository(),
			this.repositoryFactory.getDepartmentRepository(),
			this.repositoryFactory.getEmployeeRepository()
		)
	}

	getCreateDepartmentUseCase(): CreateDepartmentUseCase {
		return new CreateDepartmentUseCase(
			this.repositoryFactory.getDepartmentRepository(),
			this.repositoryFactory.getEmployeeRepository()
		)
	}

	getGetWeekConversationsMetrics(): GetWeekConversationsMetrics {
		return new GetWeekConversationsMetrics(
			this.repositoryFactory.getConversationRepository()
		)
	}

	getUpdateDepartmentUseCase(): UpdateDepartmentUseCase {
		return new UpdateDepartmentUseCase(
			this.repositoryFactory.getDepartmentRepository(),
			this.repositoryFactory.getEmployeeRepository()
		)
	}

	getCreateFAQUseCase(): CreateFAQUseCase {
		return new CreateFAQUseCase(this.repositoryFactory.getFAQRepository())
	}

	getUpdateFAQItemUseCase(): UpdateFAQItemUseCase {
		return new UpdateFAQItemUseCase(this.repositoryFactory.getFAQRepository())
	}

	getUpdateFAQCategoryNameUseCase(): UpdateFAQCategoryNameUseCase {
		return new UpdateFAQCategoryNameUseCase(
			this.repositoryFactory.getFAQRepository()
		)
	}

	getDeleteFAQItemUseCase(): DeleteFAQItemUseCase {
		return new DeleteFAQItemUseCase(this.repositoryFactory.getFAQRepository())
	}

	getDeleteFAQCategoryUseCase(): DeleteFAQCategoryUseCase {
		return new DeleteFAQCategoryUseCase(
			this.repositoryFactory.getFAQRepository()
		)
	}
}
