import { logger } from '@/core/logger'
import { Company } from '@/domain/entities/company'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { StateFactory } from '../factory/state-factory'
import { GetClientUseCase } from './get-client-use-case'
import { AgentType } from '../../@types'
import { StateName } from '../states/types'

export class TransferEmployeeToClientConversationUseCase {
	constructor(
		private conversationRepository: ConversationRepository,
		private stateFactory: StateFactory,
		private getClientUseCase: GetClientUseCase
	) {}
	async execute(employee: Employee, department: Department, company: Company) {
		const departmentQueue = department.queue
		const clientId = departmentQueue.shift()

		if (!clientId) {
			throw new Error('Department queue is empty')
		}

		const client = await this.getClientUseCase.execute(company.id, clientId)

		logger.debug(
			'looking for client conversation with client phone: ',
			client.phone
		)
		const clientConversation =
			await this.conversationRepository.findActiveByClientPhoneOrThrow(
				company.id,
				client.phone
			)

		clientConversation.upsertAgent(AgentType.EMPLOYEE, employee.id)
		clientConversation.transitionToState(
			this.stateFactory.create({
				stateName: StateName.DepartmentChatState,
				params: {
					employee,
					client,
					department,
				},
			})
		)
		await this.conversationRepository.save(clientConversation)

		return client
	}
}
