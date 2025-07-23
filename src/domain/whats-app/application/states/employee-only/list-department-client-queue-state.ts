import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { UserType } from '@/domain/whats-app/@types'
import { execute } from '@caioms/ts-utils/functions'
import { GetClientUseCase } from '../../use-cases/get-client-use-case'
import { ConversationState } from '../conversation-state'
import { StateDataType, StateName, StateTransitionIntention } from '../types'

type ListDepartmentQueueStateProps = {
	department: Department
	employee: Employee
}

export class ListDepartmentQueueState extends ConversationState<ListDepartmentQueueStateProps> {
	constructor(
		outputPort: OutputPort,
		employee: Employee,
		department: Department,
		private getClientUseCase: GetClientUseCase
	) {
		super(outputPort, { employee, department })
	}

	get department() {
		return this.props.department
	}

	get employee() {
		return this.props.employee
	}

	async handleMessage(
		message: Message
	): Promise<Nullable<StateTransitionIntention>> {
		throw new Error(
			'This state should not even last long enough to handle a message'
		)
	}

	async onEnter() {
		if (this.department.queue.length === 0) {
			return await execute(this.outputPort.handle, this.employee, {
				type: 'text',
				content: '🔔 *Fila vazia*',
			})
		}

		const clientsQueue: Client[] = []
		for (const clientInQueue of this.department.queue) {
			const client = await this.getClientUseCase.execute(
				this.department.companyId,
				clientInQueue
			)
			clientsQueue.push(client)
		}

		const textOutput: OutputMessage = {
			type: 'text',
			content: clientsQueue.reduce((acc, client) => {
				return `${acc}*${client.name}*: ${client.phone}\n`
			}, '*Fila:*\n'),
		}

		await execute(this.outputPort.handle, this.employee, textOutput)
	}

	async getNextState(
		message = ''
	): Promise<Nullable<StateTransitionIntention>> {
		return {
			target: StateName.InitialMenuState,
			context: {
				userId: this.employee.id,
				userType: UserType.EMPLOYEE,
				companyId: this.employee.companyId,
			},
		}
	}
}
