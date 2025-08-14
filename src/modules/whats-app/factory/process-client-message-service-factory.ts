import { ProcessClientMessageService } from '../services/process-client-message-service'
import { ConversationServiceFactory } from './conversation-service-factory'
import { StateOrchestratorFactory } from './state-orchestrator-factory'

export class ProcessClientMessageServiceFactory {
	constructor(
		private conversationServiceFactory: ConversationServiceFactory,
		private orchestratorFactory: StateOrchestratorFactory
	) {}

	getService() {
		return new ProcessClientMessageService(
			this.conversationServiceFactory.getService(),
			this.orchestratorFactory.getOrchestrator()
		)
	}
}
