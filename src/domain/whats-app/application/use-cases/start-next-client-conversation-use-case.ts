import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { type StateFactory } from '../factory/state-factory'
import { DepartmentQueueService } from '../services/department-queue-service'
import { TransferEmployeeToClientConversationUseCase } from './transfer-employee-to-client-conversation-use-case'
import { Company } from '@/domain/entities/company'
import { StateName } from '../states/types'
import { DepartmentService } from '../services/department-service'

export class StartNextClientConversationUseCase {
	constructor(
		private stateFactory: StateFactory,
		private departmentQueueService: DepartmentQueueService,
		private conversationRepository: ConversationRepository,
		private departmentRepository: DepartmentRepository,
		private transferEmployeeToClientConversationUseCase: TransferEmployeeToClientConversationUseCase,
		private departmentService: DepartmentService
	) {}

	async execute(company: Company, departmentId: string) {
		const nextClient = await this.departmentQueueService.getNextClient(
			company,
			departmentId
		)

		if (!nextClient) {
			throw new Error('No clients in queue')
		}

		const clientConversation =
			await this.conversationRepository.findActiveByClientPhoneOrThrow(
				company.id,
				nextClient.phone
			)
		const department = await this.departmentRepository.find(
			company.id,
			departmentId
		)

		if (!department) {
			throw new Error(`Department not found: ${departmentId}`)
		}

		const employee = await this.departmentService.getFirstEmployee(
			company.id,
			departmentId
		)

		clientConversation.transitionToState(
			this.stateFactory.create({
				stateName: StateName.DepartmentChatState,
				params: {
					department,
					client: nextClient,
					employee,
				},
			})
		)
		await this.conversationRepository.save(clientConversation)
		await await this.transferEmployeeToClientConversationUseCase.execute(
			employee,
			department,
			company
		)

		return nextClient
	}
}
