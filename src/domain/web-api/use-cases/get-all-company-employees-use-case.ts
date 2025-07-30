import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'

type EmployeesResponseData = {
	name: string
	departmentName: string
	phone: string
	available: boolean
	email: string
	totalChats: number
}

export class GetAllCompanyEmployeesUseCase {
	constructor(
		private employeeRepository: EmployeeRepository,
		private conversationRepository: ConversationRepository,
		private departmentRepository: DepartmentRepository
	) {}

	async execute(companyId: string) {
		const result: EmployeesResponseData[] = []
		const employees = await this.employeeRepository.findAllByCompany(companyId)

		for (const employee of employees) {
			let departmentName = 'Not assigned'
			const available = !!employee.departmentId
			const conversations =
				await this.conversationRepository.findAllBelongingToClient(companyId)
			const totalChats = conversations.reduce((acc, conversation) => {
				if (conversation.agentId === employee.id) {
					return acc + 1
				}
				return acc
			}, 0)

			if (employee.departmentId) {
				const department = await this.departmentRepository.find(
					companyId,
					employee.departmentId
				)

				if (department) {
					departmentName = department.name
				}
			}

			result.push({
				name: employee.name,
				departmentName,
				phone: employee.phone,
				available,
				email: 'no email',
				totalChats,
			})
		}

		return result
	}
}
