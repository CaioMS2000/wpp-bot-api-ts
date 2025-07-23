import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { isEmployee } from '@/utils/entity'
import { execute } from '@caioms/ts-utils/functions'
import { FinishClientAndEmployeeChatUseCase } from '../../use-cases/finish-client-and-employee-chat'
import { GetClientUseCase } from '../../use-cases/get-client-use-case'
import { GetCompanyUseCase } from '../../use-cases/get-company-use-case'
import { GetDepartmentByNameUseCase } from '../../use-cases/get-department-by-name-use-case'
import { GetEmployeeUseCase } from '../../use-cases/get-employee-use-case'
import { RemoveClientFromDepartmentQueue } from '../../use-cases/remove-client-from-department-queue'
import { ConversationState } from '../conversation-state'
import { StateDataType, StateName, StateTransitionIntention } from '../types'
import { UserType } from '@/domain/whats-app/@types'

type ChatWithClientStateProps = {
	employee: Employee
	department: Department
	client: Client
	company: Company
}

export class ChatWithClientState extends ConversationState<ChatWithClientStateProps> {
	constructor(
		outputPort: OutputPort,
		employee: Employee,
		department: Department,
		client: Client,
		company: Company,
		private finishClientAndEmployeeChatUseCase: FinishClientAndEmployeeChatUseCase,
		private removeClientFromDepartmentQueue: RemoveClientFromDepartmentQueue
	) {
		super(outputPort, { employee, department, client, company })
	}

	get employee() {
		return this.props.employee
	}

	get department() {
		return this.props.department
	}

	get client() {
		return this.props.client
	}

	get company() {
		return this.props.company
	}

	async handleMessage(
		message: Message
	): Promise<Nullable<StateTransitionIntention>> {
		if (message.content === '!finalizar') {
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
			content: `🔵 *[Funcionário] ${this.employee.name}*\n🚩 *${this.department.name}*\n\n${message.content}`,
		})

		return null
	}

	async onEnter() {
		await execute(
			this.removeClientFromDepartmentQueue.execute.bind(
				this.removeClientFromDepartmentQueue
			),
			this.department,
			this.client
		)
		await execute(this.outputPort.handle, this.employee, {
			type: 'text',
			content: `🔔 Você está conversando com o cliente *${this.client.name}*\n📞 *${this.client.phone}*`,
		})
	}

	async onExit() {
		await this.finishClientAndEmployeeChatUseCase.execute(
			this.company,
			this.client,
			this.employee
		)
		await execute(this.outputPort.handle, this.employee, {
			type: 'text',
			content: `🔔 Atendimento para o cliente *${this.client.name}* encerrado.`,
		})
	}
}
