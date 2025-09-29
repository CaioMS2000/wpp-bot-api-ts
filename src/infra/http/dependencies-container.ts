import { env } from '@/config/env'
import { PrismaTenantVectorStoreRepository } from '@/infra/database/repository/PrismaTenantVectorStoreRepository'
import { OpenAIResponsePort } from '@/infra/openai/OpenAIResponsePort'
import { AIChatFinalSummaryService } from '@/infra/openai/AIChatFinalSummaryService'
import { ConversationFinalSummaryService } from '@/infra/openai/ConversationFinalSummaryService'
import { EnergyBillIngestionService } from '@/infra/openai/EnergyBillIngestionService'
import { OpenAIClientRegistry } from '@/infra/openai/OpenAIClientRegistry'
import {
	ConversationLogger as ConversationLoggerBase,
	FileConversationLogger,
} from '@/infra/openai/ConversationLogger'
import { ConversationAuditLogger } from '@/infra/openai/ConversationAuditLogger'
import { FunctionToolRegistry } from '@/infra/openai/tools/FunctionTools'
import { registerBuiltinTools } from '@/infra/openai/tools'
import { InMemoryMessageQueue } from '@/infra/jobs/InMemoryMessageQueue'
import type { MessageQueue, QueueJob } from '@/infra/jobs/MessageQueue'
import type { IdempotencyStore } from '@/infra/jobs/IdempotencyStore'
import { InMemoryIdempotencyStore } from '@/infra/jobs/InMemoryIdempotencyStore'
import { ProcessIncomingMessageJob } from '@/infra/jobs/handlers/ProcessIncomingMessageJob'
import { ProcessToolIntentJob } from '@/infra/jobs/handlers/ProcessToolIntentJob'
import { CustomerServiceContextManager } from '@/modules/main/CustomerServiceContextManager'
import type { AIResponsePort } from '@/modules/main/ports/AIResponsePort'
import {
	ConsoleMessagingPort,
	MessagingPort,
} from '@/modules/main/ports/MessagingPort'
import { WhatsAppMessagingPort } from '@/modules/main/ports/WhatsAppMessagingPort'
import { AuthService } from '@/modules/web-api/services/auth-service'
import type { AIChatSessionRepository } from '@/repository/AIChatSessionRepository'
import type { GlobalConfigRepository } from '@/repository/GlobalConfigRepository'
import { ConversationRepository } from '@/repository/ConversationRepository'
import { CustomerRepository } from '@/repository/CustomerRepository'
import { DepartmentRepository } from '@/repository/DepartmentRepository'
import { EmployeeRepository } from '@/repository/EmployeeRepository'
import { FaqRepository } from '@/repository/FaqRepository'
import { StateStore } from '@/repository/StateStore'
import type { TenantRepository } from '@/repository/TenantRepository'
import type { TenantVectorStoreRepository } from '@/repository/TenantVectorStoreRepository'
import type { UserRepository } from '@/repository/UserRepository'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'
import { PrismaAIChatSessionRepository } from '../database/repository/PrismaAIChatSessionRepository'
import { PrismaConversationRepository } from '../database/repository/PrismaConversationRepository'
import { PrismaCustomerRepository } from '../database/repository/PrismaCustomerRepository'
import { PrismaDepartmentRepository } from '../database/repository/PrismaDepartmentRepository'
import { PrismaEmployeeRepository } from '../database/repository/PrismaEmployeeRepository'
import { PrismaFaqRepository } from '../database/repository/PrismaFaqRepository'
import { PrismaGlobalConfigRepository } from '../database/repository/PrismaGlobalConfigRepository'
import { PrismaStateStore } from '../database/repository/PrismaStateStore'
import { PrismaTenantRepository } from '../database/repository/PrismaTenantRepository'
import { PrismaUserRepository } from '../database/repository/PrismaUserRepository'
import { CloudFlareFileService } from '../storage/cloudflare/CloudFlareFileService'
import type { FileService } from '../storage/file-service'
import { GlobalConfigService } from '../config/GlobalConfigService'

export class DependenciesContainer {
	public prisma: PrismaClient
	public messagingPort: MessagingPort
	public conversationRepository: ConversationRepository
	public departmentRepository: DepartmentRepository
	public faqRepository: FaqRepository
	public employeeRepository: EmployeeRepository
	public prismaTenantRepository: TenantRepository
	public usersRepository: UserRepository
	public customerServiceManager: CustomerServiceContextManager
	public stateStore: StateStore
	public customerRepository: CustomerRepository
	public aiResponsePort: AIResponsePort
	public authService: AuthService
	public fileService: FileService<any>
	public openaiRegistry: OpenAIClientRegistry
	public aiChatFinalSummaryService: AIChatFinalSummaryService
	public conversationFinalSummaryService: ConversationFinalSummaryService
	public conversationLogger: ConversationLoggerBase
	public functionToolRegistry: FunctionToolRegistry
	public messageQueue: MessageQueue
	public idempotencyStore: IdempotencyStore
	public globalConfigRepository: GlobalConfigRepository
	public globalConfigService: GlobalConfigService
	constructor() {
		// third party clients
		const prisma = new PrismaClient()
		this.prisma = prisma

		// main
		// this.messagingPort = new ConsoleMessagingPort()
		this.messagingPort = new WhatsAppMessagingPort()
		this.conversationRepository = new PrismaConversationRepository(prisma)
		this.stateStore = new PrismaStateStore(prisma)
		this.customerRepository = new PrismaCustomerRepository(prisma)
		this.departmentRepository = new PrismaDepartmentRepository(prisma)
		this.employeeRepository = new PrismaEmployeeRepository(prisma)
		this.faqRepository = new PrismaFaqRepository(prisma)
		this.prismaTenantRepository = new PrismaTenantRepository(prisma)
		this.globalConfigRepository = new PrismaGlobalConfigRepository(prisma)
		this.globalConfigService = new GlobalConfigService(
			this.globalConfigRepository
		)
		const aiChatRepository: AIChatSessionRepository =
			new PrismaAIChatSessionRepository(prisma)
		const tenantVectorRepository: TenantVectorStoreRepository =
			new PrismaTenantVectorStoreRepository(prisma)

		// Per-tenant OpenAI client + Vector Store registry
		this.openaiRegistry = new OpenAIClientRegistry(
			this.prismaTenantRepository,
			tenantVectorRepository
		)
		const energyBillService = new EnergyBillIngestionService(
			this.openaiRegistry
		)
		this.aiChatFinalSummaryService = new AIChatFinalSummaryService(
			this.prisma,
			this.openaiRegistry
		)
		this.conversationFinalSummaryService = new ConversationFinalSummaryService(
			this.prisma,
			this.openaiRegistry
		)
		// Auditoria de conversas: DB-first + opcional arquivo (dev)
		const fileConvLogger = new FileConversationLogger(
			env.NODE_ENV !== 'production'
		)
		this.conversationLogger = new ConversationAuditLogger({
			prisma,
			file: fileConvLogger,
			enableDb: true,
		})
		this.functionToolRegistry = new FunctionToolRegistry()
		registerBuiltinTools(this.functionToolRegistry, {
			tenantRepo: this.prismaTenantRepository,
			departmentRepo: this.departmentRepository,
			customerRepo: this.customerRepository,
		})
		this.messageQueue = new InMemoryMessageQueue()
		this.idempotencyStore = new InMemoryIdempotencyStore()
		this.aiResponsePort = new OpenAIResponsePort(
			this.customerRepository,
			this.departmentRepository,
			this.employeeRepository,
			this.openaiRegistry,
			this.prismaTenantRepository,
			this.stateStore,
			this.conversationLogger,
			this.functionToolRegistry,
			this.messageQueue,
			aiChatRepository
		)
		this.customerServiceManager = new CustomerServiceContextManager(
			this.faqRepository,
			this.departmentRepository,
			this.employeeRepository,
			this.conversationRepository,
			this.messagingPort,
			this.stateStore,
			this.customerRepository,
			this.prismaTenantRepository,
			this.aiResponsePort,
			aiChatRepository,
			energyBillService,
			this.aiChatFinalSummaryService,
			this.conversationFinalSummaryService
		)

		// Start queue consumer (ACK rápido no webhook)
		const processor = new ProcessIncomingMessageJob(
			this.prisma,
			this.customerServiceManager,
			this.idempotencyStore
		)
		const intentProcessor = new ProcessToolIntentJob(
			this.customerServiceManager
		)
		this.messageQueue.startConsumer(
			(job: QueueJob) => {
				if ((job as any).kind === 'intent') {
					return intentProcessor.handle(job as any)
				}
				return processor.handle(job as any)
			},
			{
				concurrency: 3,
			}
		)

		// web API
		this.usersRepository = new PrismaUserRepository(prisma)
		this.authService = new AuthService(
			this.usersRepository,
			this.prismaTenantRepository
		)

		// files
		this.fileService = new CloudFlareFileService()
	}
}
