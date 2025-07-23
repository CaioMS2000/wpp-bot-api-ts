import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { execute } from '@caioms/ts-utils/functions'
import { MenuOption, UserType } from '../../../@types'
import { GetClientUseCase } from '../../use-cases/get-client-use-case'
import { GetCompanyUseCase } from '../../use-cases/get-company-use-case'
import { ListActiveDepartmentsUseCase } from '../../use-cases/list-active-departments-use-case'
import { ConversationState } from '../conversation-state'
import { StateDataType, StateName, StateTransitionIntention } from '../types'

type DepartmentSelectionStateProps = {
	activeDepartments: Department[]
	client: Client
}

export class DepartmentSelectionState extends ConversationState<DepartmentSelectionStateProps> {
	constructor(
		outputPort: OutputPort,
		client: Client,
		activeDepartments: Department[]
	) {
		super(outputPort, { activeDepartments, client })
	}

	get activeDepartments() {
		return this.props.activeDepartments
	}

	get client() {
		return this.props.client
	}

	async handleMessage(
		message: Message
	): Promise<Nullable<StateTransitionIntention>> {
		if (message.content === 'Menu principal') {
			return {
				target: StateName.InitialMenuState,
				context: {
					userId: this.client.id,
					userType: UserType.CLIENT,
					companyId: this.client.companyId,
				},
			}
		}
		const correspondingDepartment = this.activeDepartments.find(
			dept => dept.name === message.content
		)

		if (correspondingDepartment) {
			return {
				target: StateName.DepartmentQueueState,
				context: {
					departmentId: correspondingDepartment.id,
					clientPhone: this.client.phone,
					companyId: this.client.companyId,
				},
			}
		}

		await this.sendSelectionMessage()

		return null
	}

	async onEnter() {
		await this.sendSelectionMessage()
	}

	private async getDepartmentsMenu() {
		const menuOptions: MenuOption[] = this.activeDepartments
			.map((dept, index) => ({
				key: (index + 1).toString(),
				label: dept.name,
				forClient: true,
				forEmployee: false,
			}))
			.concat([
				{
					key: 'menu',
					label: 'Menu principal',
					forClient: true,
					forEmployee: true,
				},
			])

		return menuOptions
	}

	private async sendSelectionMessage() {
		const menuOptions = await this.getDepartmentsMenu()

		const listOutput: OutputMessage = {
			type: 'list',
			text: 'Departamentos',
			buttonText: 'Ver',
			sections: [
				{
					title: 'Items',
					rows: menuOptions.map(opt => ({
						id: opt.key,
						title: opt.label,
					})),
				},
			],
		} as const

		await execute(this.outputPort.handle, this.client, listOutput)
	}
}
