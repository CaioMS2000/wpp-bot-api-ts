import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { UserType } from '@/domain/whats-app/@types'
import { execute } from '@caioms/ts-utils/functions'
import { GetClientUseCase } from '../../use-cases/get-client-use-case'
import { GetCompanyUseCase } from '../../use-cases/get-company-use-case'
import { RemoveClientFromDepartmentQueue } from '../../use-cases/remove-client-from-department-queue'
import { ConversationState } from '../conversation-state'
import { StateDataType, StateName, StateTransitionIntention } from '../types'

type DepartmentQueueStateProps = {
	department: Department
	client: Client
}

export class DepartmentQueueState extends ConversationState<DepartmentQueueStateProps> {
	constructor(
		outputPort: OutputPort,
		client: Client,
		department: Department,
		private removeClientFromDepartmentQueue: RemoveClientFromDepartmentQueue
	) {
		super(outputPort, { department, client })
	}

	get department() {
		return this.props.department
	}

	get client() {
		return this.props.client
	}

	async handleMessage(
		message: Message
	): Promise<Nullable<StateTransitionIntention>> {
		if (message.content === 'sair') {
			return {
				target: StateName.InitialMenuState,
				context: {
					userId: this.client.id,
					userType: UserType.CLIENT,
					companyId: this.client.companyId,
				},
			}
		}

		await execute(this.outputPort.handle, this.client, {
			type: 'text',
			content: `🔔 Você está na fila de espera do *${this.department.name}*, em breve um atendente entrará em contato. Caso queira sair da fila de espera, digite "sair".`,
		})

		return null
	}

	async onEnter() {
		await execute(this.outputPort.handle, this.client, {
			type: 'text',
			content: `🔔 Você está na fila de espera do departamento *${this.department.name}*, em breve um atendente entrará em contato. Caso queira sair da fila de espera, digite "sair".`,
		})
	}

	async onExit() {
		await this.removeClientFromDepartmentQueue.execute(
			this.department,
			this.client
		)
	}
}
