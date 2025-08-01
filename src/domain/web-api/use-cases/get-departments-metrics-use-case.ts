import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { AgentType, UserType } from '@/domain/whats-app/@types'

type DepartmentMetricsType = {
	departmentName: string
	totalChats: number
}
export class GetDepartmentsMetricsUseCase {
	constructor(
		private conversationRepository: ConversationRepository,
		private departmentRepository: DepartmentRepository,
		private employeeRepository: EmployeeRepository
	) {}

	async execute(
		companyId: string,
		day = new Date()
	): Promise<DepartmentMetricsType[]> {
		const totalChats = await this.conversationRepository.findByMonth(
			companyId,
			day
		)
		const departmentMetrics: DepartmentMetricsType[] = []

		for (const chat of totalChats) {
			if (
				chat.userType === UserType.CLIENT &&
				chat.agentType === AgentType.EMPLOYEE &&
				chat.agentId
			) {
				// 1. Busca employee - DEVE existir
				const employee = await this.employeeRepository.findOrThrow(
					companyId,
					chat.agentId
				)

				// 2. Validação crítica: employee DEVE ter departmentId
				if (!employee.departmentId) {
					throw new Error(
						`Employee ${employee.id} is assigned to chat ${chat.id} but has no departmentId`
					)
				}

				// 3. Busca departamento - DEVE existir (pela regra de negócio)
				const department = await this.departmentRepository.findByEmployee(
					companyId,
					employee.id
				)
				if (!department) {
					throw new Error(
						`Department for employee ${employee.id} (referenced in chat ${chat.id}) not found`
					)
				}

				// 4. Atualiza métricas
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
