import {
	Conversation,
	CreateConversationInput,
} from '@/domain/entities/conversation'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import type { StateFactory } from '../factory/state-factory'
import { StateName } from '../states/types'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { User, UserType } from '../../@types'
import { CompanyRepository } from '@/domain/repositories/company-repository'

export class CreateConversationUseCase {
	constructor(
		private conversationRepository: ConversationRepository,
		private clientRepository: ClientRepository,
		private employeeRepository: EmployeeRepository,
		private companyRepository: CompanyRepository,
		private stateFactory: StateFactory
	) {}

	private async resolveUser(
		companyId: string,
		userId: string,
		userType: UserType
	): Promise<User> {
		let user: Nullable<User> = null

		if (userType === UserType.CLIENT) {
			const existingClient = await this.clientRepository.findOrThrow(
				companyId,
				userId
			)
			user = existingClient
		} else if (userType === UserType.EMPLOYEE) {
			const existingEmployee = await this.employeeRepository.findOrThrow(userId)
			user = existingEmployee
		}

		if (!user) {
			throw new Error('Invalid user')
		}

		return user
	}

	async execute(input: CreateConversationInput) {
		const user = await this.resolveUser(
			input.companyId,
			input.userId,
			input.userType
		)
		const company = await this.companyRepository.findOrThrow(input.companyId)
		const conversation = Conversation.create(input)
		conversation.currentState = this.stateFactory.create({
			stateName: StateName.InitialMenuState,
			params: {
				user,
				company,
				conversation,
			},
		})

		await this.conversationRepository.save(conversation)

		return conversation
	}
}
