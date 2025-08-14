import { ProcessEmployeeMessageService } from '../services/process-employee-message-service'
import { ConversationServiceFactory } from './conversation-service-factory'
import { StateOrchestratorFactory } from './state-orchestrator-factory'

export class ProcessEmployeeMessageServiceFactory {
	constructor(
		private conversationServiceFactory: ConversationServiceFactory,
		private orchestratorFactory: StateOrchestratorFactory
	) {}

	getService() {
		return new ProcessEmployeeMessageService(
			this.conversationServiceFactory.getService(),
			this.orchestratorFactory.getOrchestrator()
		)
	}
}
