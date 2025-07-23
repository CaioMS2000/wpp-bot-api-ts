import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { isClient, isEmployee } from '@/utils/entity'
import { execute } from '@caioms/ts-utils/functions'
import { MenuOption, User, UserType } from '../../@types'
import { GetDepartmentByNameUseCase } from '../use-cases/get-department-by-name-use-case'
import { GetDepartmentUseCase } from '../use-cases/get-department-use-case'
import { StartNextClientConversationUseCase } from '../use-cases/start-next-client-conversation-use-case'
import { ConversationState } from './conversation-state'
import { StateName, StateTransitionIntention } from './types'

export type InitialMenuStateProps = {
	user: User
	company: Company
	conversation: Conversation
}

export class InitialMenuState extends ConversationState<InitialMenuStateProps> {
	constructor(
		outputPort: OutputPort,
		user: User,
		company: Company,
		conversation: Conversation,
		private startNextClientConversationUseCase: StartNextClientConversationUseCase,
		private getDepartmentUseCase: GetDepartmentUseCase
	) {
		super(outputPort, { user, company, conversation })
	}

	get user() {
		return this.props.user
	}

	get company() {
		return this.props.company
	}

	get conversation() {
		return this.props.conversation
	}

	private menuOptions: MenuOption[] = [
		{
			key: '1',
			label: 'Conversar com IA',
			forClient: true,
			forEmployee: true,
		},
		{
			key: '2',
			label: 'Ver Departamentos',
			forClient: true,
			forEmployee: false,
		},
		{ key: '3', label: 'FAQ', forClient: true, forEmployee: true },
		{
			key: '4',
			label: 'Ver fila',
			forClient: false,
			forEmployee: true,
		},
		{
			key: '5',
			label: 'Atender próximo',
			forClient: false,
			forEmployee: true,
		},
	]

	async handleMessage(
		message: Message
	): Promise<Nullable<StateTransitionIntention>> {
		let res: Nullable<StateTransitionIntention> = null

		if (isClient(this.user)) {
			res = this.handleClientMessage(message)
		}

		if (isEmployee(this.user)) {
			res = await this.handleEmployeeMessage(this.user, message)
		}

		if (!res) {
			await execute(this.outputPort.handle, this.user, {
				type: 'text',
				content: '‼️ *Opção inválida*',
			})
			await this.sendSelectionMessage()
		}

		return res
	}

	async onEnter() {
		await this.sendSelectionMessage()
	}

	private async sendSelectionMessage() {
		const availableOptions = this.menuOptions.filter(opt => {
			if (isClient(this.user)) return opt.forClient
			return opt.forEmployee
		})

		const listOutput: OutputMessage = {
			type: 'list',
			text: 'Escolha uma das opções abaixo:',
			buttonText: 'Menu',
			sections: [
				{
					title: 'Menu principal',
					rows: availableOptions.map(opt => ({
						id: opt.key,
						title: opt.label,
					})),
				},
			],
		} as const

		await execute(this.outputPort.handle, this.user, listOutput)
	}

	private handleClientMessage(
		message: Message
	): Nullable<StateTransitionIntention> {
		if (message.content === 'Conversar com IA') {
			return {
				target: StateName.AIChatState,
				context: {
					userId: this.user.id,
					userType: UserType.CLIENT,
					companyId: this.user.companyId,
				},
			}
		}

		if (message.content === 'Ver Departamentos') {
			return {
				target: StateName.DepartmentSelectionState,
				context: {
					clientPhone: this.user.phone,
					companyId: this.user.companyId,
				},
			}
		}

		if (message.content === 'FAQ') {
			return {
				target: StateName.FAQCategoriesState,
				context: {
					userId: this.user.id,
					userType: UserType.CLIENT,
					companyId: this.user.companyId,
				},
			}
		}

		return null
	}

	private async handleEmployeeMessage(
		employee: Employee,
		message: Message
	): Promise<Nullable<StateTransitionIntention>> {
		if (message.content === 'FAQ') {
			if (isClient(this.user)) {
				return {
					target: StateName.FAQCategoriesState,
					context: {
						userId: this.user.id,
						userType: UserType.CLIENT,
						companyId: this.user.companyId,
					},
				}
			} else if (isEmployee(this.user)) {
				return {
					target: StateName.FAQCategoriesState,
					context: {
						userId: this.user.id,
						userType: UserType.EMPLOYEE,
						companyId: this.user.companyId,
					},
				}
			}
			throw new Error('Invalid user type')
		}

		if (message.content === 'Ver fila') {
			if (!employee.departmentId) {
				return null
			}

			const department = await this.getDepartmentUseCase.execute(
				this.company.id,
				employee.departmentId
			)

			return {
				target: StateName.ListDepartmentQueueState,
				context: { departmentId: department.id, companyId: this.company.id },
			}
		}

		if (message.content === 'Atender próximo') {
			if (!employee.departmentId) {
				return null
			}

			const department = await this.getDepartmentUseCase.execute(
				this.company.id,
				employee.departmentId
			)
			const nextClient = await this.startNextClientConversationUseCase.execute(
				this.company,
				department.id
			)

			return {
				target: StateName.ChatWithClientState,
				context: {
					clientPhone: nextClient.phone,
					departmentId: department.id,
					companyId: this.company.id,
				},
			}
		}

		return null
	}
}
