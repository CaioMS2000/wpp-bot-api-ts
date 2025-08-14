import { DepartmentServiceFactory } from '@/modules/whats-app/factory/department-service-factory'
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
import { UpdateEmployeeUseCase } from '../use-cases/update-employee-use-case'
import { CompanyServiceFactory } from '@/modules/whats-app/factory/company-service-factory'
import { UserServiceFactory } from '@/modules/whats-app/factory/user-service-factory'
import { DepartmentQueueServiceFactory } from '@/modules/whats-app/factory/department-queue-service-factory'
import { FAQServiceFactory } from '@/modules/whats-app/factory/faq-service-factory'
import { ConversationServiceFactory } from '@/modules/whats-app/factory/conversation-service-factory'
import { ManagerServiceFactory } from './manager-service-factory'

export class UseCaseFactory {
	constructor(
		private departmentServiceFactory: DepartmentServiceFactory,
		private departmentQueueServiceFactory: DepartmentQueueServiceFactory,
		private companyServiceFactory: CompanyServiceFactory,
		private faqServiceFactory: FAQServiceFactory,
		private userServiceFactory: UserServiceFactory,
		private conversationServiceFactory: ConversationServiceFactory,
		private managerServiceFactory: ManagerServiceFactory
	) {}

	getCreateCompanyUseCase(): CreateCompanyUseCase {
		return new CreateCompanyUseCase(this.companyServiceFactory.getService())
	}

	getCreateEmployeeUseCase(): CreateEmployeeUseCase {
		return new CreateEmployeeUseCase(
			this.userServiceFactory.getService(),
			this.departmentServiceFactory.getService()
		)
	}

	getGetAllCompanyEmployeesUseCase(): GetAllCompanyEmployeesUseCase {
		return new GetAllCompanyEmployeesUseCase(
			this.userServiceFactory.getService(),
			this.conversationServiceFactory.getService(),
			this.departmentServiceFactory.getService()
		)
	}

	getGetChatsUseCase(): GetChatsUseCase {
		return new GetChatsUseCase(
			this.conversationServiceFactory.getService(),
			this.departmentServiceFactory.getService(),
			this.departmentQueueServiceFactory.getService(),
			this.getParseChatUseCase()
		)
	}

	getGetCompanyDepartmentsUseCase(): GetCompanyDepartmentsUseCase {
		return new GetCompanyDepartmentsUseCase(
			this.departmentServiceFactory.getService()
		)
	}

	getGetCompanyUseCase(): GetCompanyUseCase {
		return new GetCompanyUseCase(this.companyServiceFactory.getService())
	}

	getGetDepartmentUseCase(): GetDepartmentUseCase {
		return new GetDepartmentUseCase(this.departmentServiceFactory.getService())
	}

	getGetEmployeeByPhoneUseCase(): GetEmployeeByPhoneUseCase {
		return new GetEmployeeByPhoneUseCase(
			this.userServiceFactory.getService(),
			this.departmentServiceFactory.getService()
		)
	}

	getGetFAQsUseCase(): GetFAQsUseCase {
		return new GetFAQsUseCase(this.faqServiceFactory.getService())
	}

	getGetManagerProfileUseCase(): GetManagerProfileUseCase {
		return new GetManagerProfileUseCase(this.managerServiceFactory.getService())
	}

	getGetRecentChatsUseCase(): GetRecentChatsUseCase {
		return new GetRecentChatsUseCase(
			this.conversationServiceFactory.getService(),
			this.getParseChatUseCase()
		)
	}

	getParseChatUseCase(): ParseChatUseCase {
		return new ParseChatUseCase(
			this.userServiceFactory.getService(),
			this.conversationServiceFactory.getService()
		)
	}

	getUpdateCompanyUseCase(): UpdateCompanyUseCase {
		return new UpdateCompanyUseCase(this.companyServiceFactory.getService())
	}

	getGetBaseMetricsUseCase(): GetBaseMetricsUseCase {
		return new GetBaseMetricsUseCase(
			this.conversationServiceFactory.getService()
		)
	}

	getGetDepartmentsMetricsUseCase(): GetDepartmentsMetricsUseCase {
		return new GetDepartmentsMetricsUseCase(
			this.conversationServiceFactory.getService(),
			this.departmentServiceFactory.getService(),
			this.userServiceFactory.getService()
		)
	}

	getCreateDepartmentUseCase(): CreateDepartmentUseCase {
		return new CreateDepartmentUseCase(
			this.departmentServiceFactory.getService(),
			this.userServiceFactory.getService()
		)
	}

	getGetWeekConversationsMetrics(): GetWeekConversationsMetrics {
		return new GetWeekConversationsMetrics(
			this.conversationServiceFactory.getService()
		)
	}

	getUpdateDepartmentUseCase(): UpdateDepartmentUseCase {
		return new UpdateDepartmentUseCase(
			this.departmentServiceFactory.getService(),
			this.userServiceFactory.getService()
		)
	}

	getCreateFAQUseCase(): CreateFAQUseCase {
		return new CreateFAQUseCase(this.faqServiceFactory.getService())
	}

	getUpdateFAQItemUseCase(): UpdateFAQItemUseCase {
		return new UpdateFAQItemUseCase(this.faqServiceFactory.getService())
	}

	getUpdateFAQCategoryNameUseCase(): UpdateFAQCategoryNameUseCase {
		return new UpdateFAQCategoryNameUseCase(this.faqServiceFactory.getService())
	}

	getDeleteFAQItemUseCase(): DeleteFAQItemUseCase {
		return new DeleteFAQItemUseCase(this.faqServiceFactory.getService())
	}

	getDeleteFAQCategoryUseCase(): DeleteFAQCategoryUseCase {
		return new DeleteFAQCategoryUseCase(this.faqServiceFactory.getService())
	}

	getUpdateEmployeeUseCase(): UpdateEmployeeUseCase {
		return new UpdateEmployeeUseCase(
			this.userServiceFactory.getService(),
			this.departmentServiceFactory.getService()
		)
	}
}
