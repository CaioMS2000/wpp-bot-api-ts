import { AgentType, UserType } from '@/@types'
import { ConversationService } from '@/modules/whats-app/services/conversation-service'
import { DepartmentService } from '@/modules/whats-app/services/department-service'
import { UserService } from '@/modules/whats-app/services/user-service'

type DepartmentMetricsType = {
	departmentName: string
	totalChats: number
}
export class GetDepartmentsMetricsUseCase {
	constructor(
		private conversationService: ConversationService,
		private departmentService: DepartmentService,
		private userService: UserService
	) {}

	async execute(
		companyId: string,
		day = new Date()
	): Promise<DepartmentMetricsType[]> {
		const totalChats = await this.conversationService.getByMonth(companyId, day)
		const departmentMetrics: DepartmentMetricsType[] = []

		for (const chat of totalChats) {
			if (
				chat.userType === UserType.CLIENT &&
				chat.agentType === AgentType.EMPLOYEE &&
				chat.agentId
			) {
				const employee = await this.userService.getEmployee(
					companyId,
					chat.agentId,
					{ notNull: true }
				)

				if (!employee.departmentId) {
					throw new Error(
						`Employee ${employee.id} is assigned to chat ${chat.id} but has no departmentId`
					)
				}

				const department =
					await this.departmentService.getDepartmentFromEmployee(
						companyId,
						employee.id
					)

				const existingMetric = departmentMetrics.find(
					dm => dm.departmentName === department.name
				)
				if (existingMetric) {
					existingMetric.totalChats++
				} else {
					departmentMetrics.push({
						departmentName: department.name,
						totalChats: 1,
					})
				}
			}
		}
		return departmentMetrics
	}
}
