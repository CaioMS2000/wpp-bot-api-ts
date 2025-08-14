import { ConversationService } from '@/modules/whats-app/services/conversation-service'
import { DepartmentService } from '@/modules/whats-app/services/department-service'
import { UserService } from '@/modules/whats-app/services/user-service'

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
		private userService: UserService,
		private conversationService: ConversationService,
		private departmentService: DepartmentService
	) {}

	async execute(companyId: string) {
		const result: EmployeesResponseData[] = []
		const employees = await this.userService.getAllEmployeesByCompany(companyId)

		for (const employee of employees) {
			let departmentName = 'Not assigned'
			const available = !!employee.departmentId
			const conversations =
				await this.conversationService.getAllBelongingToClient(companyId)
			const totalChats = conversations.reduce((acc, conversation) => {
				if (conversation.agentId === employee.id) {
					return acc + 1
				}
				return acc
			}, 0)

			if (employee.departmentId) {
				const department = await this.departmentService.findDepartment(
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
