import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Department } from '@/domain/entities/department'
import type { Employee } from '@/domain/entities/employee'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { prisma } from '@/lib/prisma'
import { DepartmentMapper } from '../../mappers/department-mapper'

export class PrismaDepartmentRepository extends DepartmentRepository {
	async save(department: Department): Promise<void> {
		const data = DepartmentMapper.toModel(department)

		await prisma.department.upsert({
			where: { id: department.id },
			update: data,
			create: {
				...data,
				id: department.id,
			},
		})
	}

	async find(companyId: string, id: string): Promise<Nullable<Department>> {
		const raw = await prisma.department.findUnique({
			where: { id, companyId },
			include: {
				queue: {
					include: {
						client: true,
					},
					orderBy: {
						joinedAt: 'asc',
					},
				},
				company: {
					include: {
						manager: true,
						businessHours: true,
					},
				},
				employees: true,
			},
		})

		if (!raw) return null

		const department = DepartmentMapper.toEntity(raw)
		department.queue = raw.queue.map(q => q.clientId)
		department.employees = raw.employees.map(e => e.id)

		return department
	}

	async findOrThrow(companyId: string, id: string): Promise<Department> {
		const raw = await this.find(companyId, id)
		if (!raw) {
			throw new Error(`Department with id ${id} not found`)
		}
		return raw
	}

	async findByName(
		companyId: string,
		name: string
	): Promise<Nullable<Department>> {
		const raw = await prisma.department.findFirst({
			where: {
				name,
				companyId,
			},
			include: {
				company: {
					include: {
						manager: true,
						businessHours: true,
					},
				},
				employees: true,
				queue: {
					include: {
						client: true,
					},
					orderBy: {
						joinedAt: 'asc',
					},
				},
			},
		})

		if (!raw) return null

		const department = DepartmentMapper.toEntity(raw)
		department.queue = raw.queue.map(q => q.clientId)
		department.employees = raw.employees.map(e => e.id)

		return department
	}

	async findByNameOrThrow(
		companyId: string,
		name: string
	): Promise<Department> {
		const department = await this.findByName(companyId, name)
		if (!department) {
			throw new Error(`Department "${name}" not found for company ${companyId}`)
		}
		return department
	}

	async findAllActive(companyId: string): Promise<Department[]> {
		const departments: Department[] = []
		const rawDepartments = await prisma.department.findMany({
			where: {
				companyId,
			},
			include: {
				company: {
					include: {
						manager: true,
						businessHours: true,
					},
				},
				employees: true,
				queue: {
					include: {
						client: true,
					},
					orderBy: {
						joinedAt: 'asc',
					},
				},
			},
		})

		for (const rawDepartment of rawDepartments) {
			const department = DepartmentMapper.toEntity(rawDepartment)
			department.queue = rawDepartment.queue.map(q => q.clientId)
			department.employees = rawDepartment.employees.map(e => e.id)

			departments.push(department)
		}

		return departments
	}

	async insertClientIntoQueue(
		department: Department,
		client: Client
	): Promise<void> {
		await prisma.department.update({
			where: {
				id: department.id,
			},
			data: {
				queue: {
					connect: { id: client.id },
				},
			},
		})
	}

	async removeClientFromQueue(
		department: Department,
		client: Client
	): Promise<void> {
		await prisma.department.update({
			where: {
				id: department.id,
			},
			data: {
				queue: {
					disconnect: { id: client.id },
				},
			},
		})
	}

	async getClientPositionInQueue(
		department: Department,
		client: Client
	): Promise<Nullable<number>> {
		const queue = await prisma.departmentQueue.findMany({
			where: {
				departmentId: department.id,
				clientId: client.id,
				leftAt: null,
			},
			orderBy: {
				joinedAt: 'asc',
			},
		})

		if (queue.length === 0) {
			return null
		}
		const index = queue.findIndex(q => q.clientId === client.id)

		return index >= 0 ? index : null
	}

	async getNextClientFromQueue(
		department: Department
	): Promise<Nullable<string>> {
		const queue = await prisma.departmentQueue.findMany({
			where: {
				departmentId: department.id,
				leftAt: null,
			},
			orderBy: {
				joinedAt: 'asc',
			},
		})

		if (queue.length === 0) {
			return null
		}

		const queueItem = queue[0]

		return queueItem.clientId
	}
}
