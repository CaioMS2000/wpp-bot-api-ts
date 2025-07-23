import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { AgentType } from '@/domain/whats-app/@types'
import { execute } from '@caioms/ts-utils/functions'
import { GetClientUseCase } from '../../use-cases/get-client-use-case'
import { GetCompanyUseCase } from '../../use-cases/get-company-use-case'
import { GetEmployeeUseCase } from '../../use-cases/get-employee-use-case'
import { ConversationState } from '../conversation-state'
import { StateDataType, StateTransitionIntention } from '../types'

type DepartmentChatStateProps = {
	department: Department
	employee: Employee
	client: Client
}

export class DepartmentChatState extends ConversationState<DepartmentChatStateProps> {
	constructor(
		outputPort: OutputPort,
		employee: Employee,
		client: Client,
		department: Department
	) {
		super(outputPort, { department, employee, client })
	}

	get department() {
		return this.props.department
	}

	get employee() {
		return this.props.employee
	}

	get client() {
		return this.props.client
	}

	async handleMessage(
		message: Message
	): Promise<Nullable<StateTransitionIntention>> {
		await execute(this.outputPort.handle, this.employee, {
			type: 'text',
			content: `🔵 *[Cliente] ${this.client.name}*\n📞 *${this.client.phone}*\n\n${message.content}`,
		})

		return null
	}

	async onEnter() {
		await execute(this.outputPort.handle, this.client, {
			type: 'text',
			content: `🔔 Você está conversando com o departamento: ${this.department.name}`,
		})
	}

	async onExit() {
		await execute(this.outputPort.handle, this.client, {
			type: 'text',
			content: '🔔 *O atendimento foi encerrado*',
		})
	}
}
