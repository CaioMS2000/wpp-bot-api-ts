import { OutputPort } from '@/output/output-port'
import { StateServiceFactory } from './state-service-factory'
import { FAQServiceFactory } from './faq-service-factory'
import { ConversationServiceFactory } from './conversation-service-factory'
import { DepartmentServiceFactory } from './department-service-factory'
import { DepartmentQueueServiceFactory } from './department-queue-service-factory'
import { StateContextServiceFactory } from './state-context-service-factory'
import { UserServiceFactory } from './user-service-factory'
import { ConversationStateOrchestrator } from '../services/state-orchestrator'

export class StateOrchestratorFactory {
	constructor(
		private outputPort: OutputPort,
		private stateServiceFactory: StateServiceFactory,
		private faqServiceFactory: FAQServiceFactory,
		private conversationServiceFactory: ConversationServiceFactory,
		private departmentServiceFactory: DepartmentServiceFactory,
		private departmentQueueServiceFactory: DepartmentQueueServiceFactory,
		private userServiceFactory: UserServiceFactory,
		private stateContextServiceFactory: StateContextServiceFactory
	) {}

	getOrchestrator() {
		return new ConversationStateOrchestrator(
			this.outputPort,
			this.stateServiceFactory.getService(),
			this.faqServiceFactory.getService(),
			this.conversationServiceFactory.getService(),
			this.departmentServiceFactory.getService(),
			this.departmentQueueServiceFactory.getService(),
			this.userServiceFactory.getService(),
			this.stateContextServiceFactory.getService()
		)
	}
}
