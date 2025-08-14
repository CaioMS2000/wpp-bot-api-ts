import { NotNullConfig, NotNullParams } from '@/@types/not-null-params'
import { Department } from '@/entities/department'
import { Employee } from '@/entities/employee'
import { ResourceNotFoundError } from '@/errors/errors/resource-not-found-error'
import { ConversationMapper } from '@/infra/database/mappers/conversation-mapper'
import { DepartmentMapper } from '@/infra/database/mappers/department-mapper'
import { EmployeeMapper } from '@/infra/database/mappers/employee-mapper'
import { prisma } from '@/lib/prisma'
import { DepartmentHasNoEmployeesError } from '../errors/department-has-no-employees'
import { EmployeeNotAssignedToAnyDpartmentError } from '../errors/employee-not-assigned'
import { InconsistencyError } from '../errors/inconsistency'
import { UserService } from './user-service'

export class DepartmentService {
	constructor(private userService: UserService) {}

	async save(department: Department) {
		await prisma.department.update({
			where: {
				id: department.id,
				companyId: department.companyId,
			},
			data: {
				name: department.name,
				description: department.description,
			},
		})
	}

	async getEmployees(companyId: string, departmentId: string) {
		const department = await this.findDepartment(companyId, departmentId, {
			notNull: true,
		})
		const employeesModels = await prisma.employee.findMany({
			where: {
				companyId,
				departmentId: department.id,
			},
		})

		return employeesModels.map(EmployeeMapper.toEntity)
	}

	async getDepartmentEmployee(
		companyId: string,
		departmentId: string,
		employeeId?: string
	) {
		const employees = await this.getEmployees(companyId, departmentId)
		let employee: Nullable<Employee> = null

		if (employeeId) {
			employee = employees.find(e => e.id === employeeId) ?? null
		} else {
			employee = employees.at(0) ?? null
		}

		if (!employee) {
			throw new DepartmentHasNoEmployeesError()
		}

		return employee
	}

	async findAllDepartments(companyId: string) {
		const models = await prisma.department.findMany({ where: { companyId } })

		return models.map(DepartmentMapper.toEntity)
	}

	async findDepartment(
		companyId: string,
		departmentId: string
	): Promise<Nullable<Department>>
	async findDepartment(
		companyId: string,
		departmentId: string,
		config: NotNullConfig
	): Promise<Department>
	async findDepartment(
		companyId: string,
		departmentId: string,
		config?: NotNullParams
	) {
		const model = await prisma.department.findFirst({
			where: { companyId, id: departmentId },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Department not found')
			}

			return null
		}

		return DepartmentMapper.toEntity(model)
	}

	async getDepartmentFromEmployee(companyId: string, employeeId: string) {
		const employee = await prisma.employee.findUniqueOrThrow({
			where: { id: employeeId, companyId },
		})

		if (!employee.departmentId) {
			throw new EmployeeNotAssignedToAnyDpartmentError()
		}

		const model = await prisma.department.findUniqueOrThrow({
			where: { companyId, id: employee.departmentId },
		})

		return DepartmentMapper.toEntity(model)
	}

	async getInChatClient(companyId: string, agentId: string) {
		const conversations = await prisma.conversation.findMany({
			where: {
				companyId,
				clientId: { not: null },
				agentType: { not: null },
				agentId: agentId,
				endedAt: null,
			},
		})

		if (conversations.length > 1) {
			throw new InconsistencyError(
				'Same client have more than one active conversation'
			)
		}

		if (conversations.length === 0) {
			throw new InconsistencyError(
				'Cant not find a client with an open conversation'
			)
		}

		const model = conversations[0]

		if (!model.clientId)
			throw new InconsistencyError(
				'Conversation has no clientId when it should have.'
			)

		const client = await this.userService.getClient(companyId, model.clientId, {
			notNull: true,
		})

		return { client, clientConversation: ConversationMapper.toEntity(model) }
	}
}
