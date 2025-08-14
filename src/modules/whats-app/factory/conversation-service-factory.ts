import { ConversationService } from '../services/conversation-service'
import { CompanyServiceFactory } from './company-service-factory'
import { DepartmentQueueServiceFactory } from './department-queue-service-factory'
import { UserServiceFactory } from './user-service-factory'

export class ConversationServiceFactory {
	constructor(
		private userServiceFactory: UserServiceFactory,
		private companyServiceFactory: CompanyServiceFactory,
		private departmentQueueServiceFactory: DepartmentQueueServiceFactory
	) {}

	getService(): ConversationService {
		return new ConversationService(
			this.userServiceFactory.getService(),
			this.companyServiceFactory.getService(),
			this.departmentQueueServiceFactory.getService()
		)
	}
}
