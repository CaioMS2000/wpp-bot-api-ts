import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { UserType } from '../../@types'
import type { StateFactory } from '../factory/state-factory'
import { InitialMenuState } from '../states/initial-menu-state'
import { StateName } from '../states/types'

export class FinishClientAndEmployeeChatUseCase {
	constructor(
		private conversationRepository: ConversationRepository,
		private stateFactory: StateFactory
	) {}

	async execute(company: Company, client: Client, employee: Employee) {
		let clientConversation =
			await this.conversationRepository.findActiveByClientPhoneOrThrow(
				company.id,
				client.phone
			)
		const employeeConversation =
			await this.conversationRepository.findActiveByEmployeePhoneOrThrow(
				company.id,
				employee.phone
			)

		clientConversation.endedAt = new Date()

		await this.conversationRepository.save(clientConversation)
		await clientConversation.currentState.onExit()

		clientConversation = Conversation.create({
			userId: client.id,
			companyId: company.id,
			userType: UserType.CLIENT,
		})

		clientConversation.currentState = this.stateFactory.create({
			stateName: StateName.InitialMenuState,
			params: {
				user: client,
				company,
				conversation: clientConversation,
			},
		})

		await this.conversationRepository.save(clientConversation)
		employeeConversation.currentState = this.stateFactory.create({
			stateName: StateName.InitialMenuState,
			params: {
				user: employee,
				company,
				conversation: employeeConversation,
			},
		})

		await this.conversationRepository.save(employeeConversation)
	}
}
