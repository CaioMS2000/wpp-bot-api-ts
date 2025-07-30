import { DepartmentServiceFactory } from '@/domain/whats-app/application/factory/department-service-factory'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { CreateCompanyUseCase } from '../use-cases/create-company-use-case'
import { CreateEmployeeUseCase } from '../use-cases/create-employee-use-case'
import { GetAllCompanyEmployeesUseCase } from '../use-cases/get-all-company-employees-use-case'
import { GetChatsUseCase } from '../use-cases/get-chats-use-case'
import { GetCompanyDepartmentsUseCase } from '../use-cases/get-company-departments-use-case'
import { GetCompanyInfoUseCase } from '../use-cases/get-company-info-use-case'
import { GetDepartmentUseCase } from '../use-cases/get-department-use-case'
import { GetEmployeeByPhoneUseCase } from '../use-cases/get-employee-by-phone-use-case'
import { GetFAQsUseCase } from '../use-cases/get-faqs-use-case'
import { GetManagerProfileUseCase } from '../use-cases/get-manager-profile-use-case'
import { GetRecentChatsUseCase } from '../use-cases/get-recent-chats-use-case'
import { ParseChatUseCase } from '../use-cases/parse-chat-use-case'
import { UpdateCompanyUseCase } from '../use-cases/update-company-use-case'

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
			this.repositoryFactory.getEmployeeRepository()
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

	getGetCompanyInfoUseCase(): GetCompanyInfoUseCase {
		return new GetCompanyInfoUseCase(
			this.repositoryFactory.getCompanyRepository()
		)
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
}
