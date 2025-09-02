import { OpenAIServiceFactory } from '@/infra/factory/openai/ai-service-factory'
import { AuthServiceFactory } from '@/modules/web-api/factories/auth-service-factory'
import { ManagerServiceFactory } from '@/modules/web-api/factories/manager-service-factory'
import { UseCaseFactory as WebAPIUseCaseFactory } from '@/modules/web-api/factories/use-case-factory'
import { ManagerService } from '@/modules/web-api/services/manager-service'
import { CompanyServiceFactory } from '@/modules/whats-app/factory/company-service-factory'
import { ConversationServiceFactory } from '@/modules/whats-app/factory/conversation-service-factory'
import { DepartmentQueueServiceFactory } from '@/modules/whats-app/factory/department-queue-service-factory'
import { DepartmentServiceFactory } from '@/modules/whats-app/factory/department-service-factory'
import { FAQServiceFactory } from '@/modules/whats-app/factory/faq-service-factory'
import { MessageHandlerFactory } from '@/modules/whats-app/factory/message-handler-factory'
import { ProcessClientMessageServiceFactory } from '@/modules/whats-app/factory/process-client-message-service-factory'
import { ProcessEmployeeMessageServiceFactory } from '@/modules/whats-app/factory/process-employee-message-service-factory'
import { StateContextServiceFactory } from '@/modules/whats-app/factory/state-context-service-factory'
import { StateOrchestratorFactory } from '@/modules/whats-app/factory/state-orchestrator-factory'
import { StateServiceFactory } from '@/modules/whats-app/factory/state-service-factory'
import { UserServiceFactory } from '@/modules/whats-app/factory/user-service-factory'
import { WhatsAppMessageServiceFactory } from '@/modules/whats-app/factory/whats-app-message-service-factory'
import { CompanyService } from '@/modules/whats-app/services/company-service'
import { WhatsAppMediaService } from '@/modules/whats-app/services/whatsapp-media-service'
import { FileServiceFactory } from '../factory/storage/file-service-factory'
import { WhatsAppOutputPort } from './output/whats-app-output-port'

export class DependenciesContainer {
	public readonly outputPort = new WhatsAppOutputPort()

	// WhatsApp Factories
	public readonly companyServiceFactory: CompanyServiceFactory
	public readonly conversationServiceFactory: ConversationServiceFactory
	public readonly departmentServiceFactory: DepartmentServiceFactory
	public readonly departmentQueueServiceFactory: DepartmentQueueServiceFactory
	public readonly faqServiceFactory: FAQServiceFactory
	public readonly messageHandlerFactory: MessageHandlerFactory
	public readonly stateServiceFactory: StateServiceFactory
	public readonly stateOrchestratorFactory: StateOrchestratorFactory
	public readonly stateContextServiceFactory: StateContextServiceFactory
	public readonly processClientMessageServiceFactory: ProcessClientMessageServiceFactory
	public readonly processEmployeeMessageServiceFactory: ProcessEmployeeMessageServiceFactory
	public readonly userServiceFactory: UserServiceFactory
	public readonly whatsAppMessageServiceFactory: WhatsAppMessageServiceFactory

	// Web API Factories
	public readonly authServiceFactory: AuthServiceFactory
	public readonly webAPIUseCaseFactory: WebAPIUseCaseFactory
	public readonly managerServiceFactory: ManagerServiceFactory
	public readonly fileServiceFactory: FileServiceFactory

	// other factories
	public readonly aiServiceFactory: OpenAIServiceFactory

	// Services
	public readonly whatsAppMessageService: ReturnType<
		WhatsAppMessageServiceFactory['getService']
	>
	public readonly whatsAppMediaService: WhatsAppMediaService
	public readonly managerService: ManagerService
	public readonly companyService: CompanyService
	public readonly authService: ReturnType<AuthServiceFactory['getService']>

	constructor() {
		this.whatsAppMediaService = new WhatsAppMediaService()
		this.companyServiceFactory = new CompanyServiceFactory()
		this.faqServiceFactory = new FAQServiceFactory()
		this.userServiceFactory = new UserServiceFactory(this.companyServiceFactory)
		this.departmentServiceFactory = new DepartmentServiceFactory(
			this.userServiceFactory
		)
		this.stateContextServiceFactory = new StateContextServiceFactory()
		this.departmentQueueServiceFactory = new DepartmentQueueServiceFactory(
			this.departmentServiceFactory,
			this.userServiceFactory
		)
		this.conversationServiceFactory = new ConversationServiceFactory(
			this.userServiceFactory,
			this.companyServiceFactory,
			this.departmentQueueServiceFactory
		)
		this.aiServiceFactory = new OpenAIServiceFactory(
			this.conversationServiceFactory,
			this.userServiceFactory,
			this.companyServiceFactory,
			this.whatsAppMediaService
		)

		this.stateServiceFactory = new StateServiceFactory(
			this.faqServiceFactory,
			this.departmentServiceFactory,
			this.userServiceFactory,
			this.conversationServiceFactory,
			this.companyServiceFactory
		)
		this.stateOrchestratorFactory = new StateOrchestratorFactory(
			this.outputPort,
			this.aiServiceFactory,
			this.stateServiceFactory,
			this.faqServiceFactory,
			this.conversationServiceFactory,
			this.departmentServiceFactory,
			this.departmentQueueServiceFactory,
			this.userServiceFactory,
			this.stateContextServiceFactory
		)

		// WhatsApp Message Services
		this.processClientMessageServiceFactory =
			new ProcessClientMessageServiceFactory(
				this.conversationServiceFactory,
				this.stateOrchestratorFactory
			)

		this.processEmployeeMessageServiceFactory =
			new ProcessEmployeeMessageServiceFactory(
				this.conversationServiceFactory,
				this.stateOrchestratorFactory
			)

		this.messageHandlerFactory = new MessageHandlerFactory(
			this.processClientMessageServiceFactory.getService(),
			this.processEmployeeMessageServiceFactory.getService()
		)
		this.whatsAppMessageServiceFactory = new WhatsAppMessageServiceFactory(
			this.messageHandlerFactory,
			this.userServiceFactory
		)

		// Instanciar serviços
		this.whatsAppMessageService =
			this.whatsAppMessageServiceFactory.getService()
		this.companyService = this.companyServiceFactory.getService()

		// Web API Factories
		this.fileServiceFactory = new FileServiceFactory()
		this.managerServiceFactory = new ManagerServiceFactory()
		this.authServiceFactory = new AuthServiceFactory(
			this.companyServiceFactory,
			this.managerServiceFactory
		)
		this.webAPIUseCaseFactory = new WebAPIUseCaseFactory(
			this.departmentServiceFactory,
			this.departmentQueueServiceFactory,
			this.companyServiceFactory,
			this.faqServiceFactory,
			this.userServiceFactory,
			this.conversationServiceFactory,
			this.managerServiceFactory
		)

		// Web API services
		this.authService = this.authServiceFactory.getService()
		this.managerService = this.managerServiceFactory.getService()
	}
}
