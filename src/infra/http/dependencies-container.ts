import { AuthServiceFactory } from '@/domain/web-api/factories/auth-service-factory'
import { UseCaseFactory as WebAPIUseCaseFactory } from '@/domain/web-api/factories/use-case-factory'
import { AIServiceFactory } from '@/domain/whats-app/application/factory/ai-service-factory'
import { DepartmentQueueServiceFactory } from '@/domain/whats-app/application/factory/department-queue-service-factory'
import { DepartmentServiceFactory } from '@/domain/whats-app/application/factory/department-service-factory'
import { ProcessClientMessageServiceFactory } from '@/domain/whats-app/application/factory/process-client-message-service-factory'
import { ProcessEmployeeMessageServiceFactory } from '@/domain/whats-app/application/factory/process-employee-message-service-factory'
import { StateFactory } from '@/domain/whats-app/application/factory/state-factory'
import { StateServiceFactory } from '@/domain/whats-app/application/factory/state-service-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { WhatsAppMessageServiceFactory } from '@/domain/whats-app/application/factory/whats-app-message-service-factory'
import { PrismaStateDataParser } from '../database/state-data-parser/prisma/prisma-state-data-parser'
import { PrismaRepositoryFactory } from '../factory/prisma/prisma-repository-factory'
import { WhatsAppOutputPort } from './output/whats-app-output-port'

export class DependenciesContainer {
	public readonly outputPort = new WhatsAppOutputPort()
	public readonly repositoryFactory = new PrismaRepositoryFactory()

	// WhatsApp Factories
	public readonly aiServiceFactory: AIServiceFactory
	public readonly stateFactory: StateFactory
	public readonly departmentServiceFactory: DepartmentServiceFactory
	public readonly departmentQueueServiceFactory: DepartmentQueueServiceFactory
	public readonly useCaseFactory: UseCaseFactory
	public readonly stateServiceFactory: StateServiceFactory
	public readonly processClientMessageServiceFactory: ProcessClientMessageServiceFactory
	public readonly processEmployeeMessageServiceFactory: ProcessEmployeeMessageServiceFactory
	public readonly whatsAppMessageServiceFactory: WhatsAppMessageServiceFactory

	// Web API Factories
	public readonly authServiceFactory: AuthServiceFactory
	public readonly webAPIUseCaseFactory: WebAPIUseCaseFactory

	// Services
	public readonly whatsAppMessageService: ReturnType<
		WhatsAppMessageServiceFactory['getService']
	>
	public readonly authService: ReturnType<AuthServiceFactory['getService']>

	constructor() {
		// Primeira fase - construção sem dependências circulares
		this.aiServiceFactory = new AIServiceFactory({
			repositoryFactory: this.repositoryFactory,
			useCaseFactory: null as any, // Será definido depois
		})

		this.stateFactory = new StateFactory({
			outputPort: this.outputPort,
			aiServiceFactory: this.aiServiceFactory,
		})

		this.departmentServiceFactory = new DepartmentServiceFactory(
			this.repositoryFactory
		)

		this.departmentQueueServiceFactory = new DepartmentQueueServiceFactory(
			this.repositoryFactory
		)

		// Web API Factories
		this.authServiceFactory = new AuthServiceFactory(this.repositoryFactory)
		this.webAPIUseCaseFactory = new WebAPIUseCaseFactory(
			this.repositoryFactory,
			this.departmentServiceFactory
		)

		// Segunda fase - resolver dependências circulares
		this.useCaseFactory = new UseCaseFactory({
			repositoryFactory: this.repositoryFactory,
			stateFactory: this.stateFactory,
			departmentQueueServiceFactory: this.departmentQueueServiceFactory,
			departmentServiceFactory: this.departmentServiceFactory,
		})

		// Configurar dependências circulares
		this.stateFactory.setUseCaseFactory(this.useCaseFactory)
		this.aiServiceFactory.dependencies.useCaseFactory = this.useCaseFactory

		// Terceira fase - inicialização completa
		const departmentService = this.departmentServiceFactory.getService()
		const prismaStateDataParser = new PrismaStateDataParser(
			this.stateFactory,
			this.repositoryFactory,
			this.useCaseFactory,
			departmentService
		)

		this.repositoryFactory.setPrismaStateDataParser(prismaStateDataParser)

		this.stateServiceFactory = new StateServiceFactory(
			this.repositoryFactory,
			this.useCaseFactory,
			this.stateFactory,
			this.departmentServiceFactory
		)

		// WhatsApp Message Services
		this.processClientMessageServiceFactory =
			new ProcessClientMessageServiceFactory(
				this.repositoryFactory,
				this.useCaseFactory,
				this.stateServiceFactory
			)

		this.processEmployeeMessageServiceFactory =
			new ProcessEmployeeMessageServiceFactory(
				this.repositoryFactory,
				this.useCaseFactory,
				this.stateServiceFactory
			)

		this.whatsAppMessageServiceFactory = new WhatsAppMessageServiceFactory(
			this.repositoryFactory,
			this.useCaseFactory,
			this.processClientMessageServiceFactory,
			this.processEmployeeMessageServiceFactory
		)

		// Instanciar serviços
		this.whatsAppMessageService =
			this.whatsAppMessageServiceFactory.getService()
		this.authService = this.authServiceFactory.getService()
	}
}
