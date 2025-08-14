import { StateService } from '../services/state-service'
import { CompanyServiceFactory } from './company-service-factory'
import { ConversationServiceFactory } from './conversation-service-factory'
import { DepartmentServiceFactory } from './department-service-factory'
import { FAQServiceFactory } from './faq-service-factory'
import { UserServiceFactory } from './user-service-factory'

export class StateServiceFactory {
	constructor(
		private faqServiceFactory: FAQServiceFactory,
		private departmentServiceFactory: DepartmentServiceFactory,
		private userServiceFactory: UserServiceFactory,
		private conversationServiceFactory: ConversationServiceFactory,
		private companyServiceFactory: CompanyServiceFactory
	) {}

	getService() {
		return new StateService(
			this.faqServiceFactory.getService(),
			this.departmentServiceFactory.getService(),
			this.userServiceFactory.getService(),
			this.companyServiceFactory.getService(),
			this.conversationServiceFactory.getService()
		)
	}
}
