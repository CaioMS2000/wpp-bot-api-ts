import { MessageHandlerFactory } from './message-handler-factory'
import { WhatsAppMessageService } from '../services/whats-app-message-service'
import { UserServiceFactory } from './user-service-factory'

export class WhatsAppMessageServiceFactory {
	constructor(
		private messageHandlerFactory: MessageHandlerFactory,
		private userServiceFactory: UserServiceFactory
	) {}
	getService() {
		return new WhatsAppMessageService(
			this.messageHandlerFactory,
			this.userServiceFactory.getService()
		)
	}
}
