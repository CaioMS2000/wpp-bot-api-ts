import { ClientMessageHandler } from '../handler/client-message-handler'
import { EmployeeMessageHandler } from '../handler/employee-message-handler'
import { MessageHandler } from '../handler/message-handler'
import { ProcessClientMessageService } from '../services/process-client-message-service'
import { ProcessEmployeeMessageService } from '../services/process-employee-message-service'

export class MessageHandlerFactory {
	constructor(
		private processClientMessageService: ProcessClientMessageService,
		private processEmployeeMessageService: ProcessEmployeeMessageService
	) {}

	createClientMessageHandler(): MessageHandler {
		return new ClientMessageHandler(this.processClientMessageService)
	}

	createEmployeeMessageHandler(): MessageHandler {
		return new EmployeeMessageHandler(this.processEmployeeMessageService)
	}
}
