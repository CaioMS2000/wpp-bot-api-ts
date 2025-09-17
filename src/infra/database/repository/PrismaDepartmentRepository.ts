import {
	DepartmentRepository,
	QueueEntry,
} from '@/repository/DepartmentRepository'
import { PrismaClient } from '@prisma/client'

export class PrismaDepartmentRepository implements DepartmentRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async listDepartments(tenantId: string): Promise<string[]> {
		const departments = await this.prisma.department.findMany({
			where: { tenantId },
			select: { name: true },
			orderBy: { name: 'asc' },
		})
		return departments.map(d => d.name)
	}

	async enqueueCustomer(
		tenantId: string,
		departmentName: string,
		customerPhone: string
	): Promise<void> {
		const dept = await this.prisma.department.findUnique({
			where: { tenantId_name: { tenantId, name: departmentName } },
			select: { id: true },
		})
		if (!dept) {
			throw new Error('DepartmentNotFound')
		}

		// Avoid duplicate queue entries for same customer+department
		await this.prisma.departmentQueueEntry.upsert({
			where: {
				departmentId_customerPhone: {
					departmentId: dept.id,
					customerPhone,
				},
			},
			update: {},
			create: {
				tenantId,
				departmentId: dept.id,
				customerPhone,
			},
		})
	}

	async listQueue(
		tenantId: string,
		departmentName: string
	): Promise<QueueEntry[]> {
		const dept = await this.prisma.department.findUnique({
			where: { tenantId_name: { tenantId, name: departmentName } },
			select: { id: true },
		})
		if (!dept) return []

		const rows = await this.prisma.departmentQueueEntry.findMany({
			where: { departmentId: dept.id, tenantId },
			select: { customerPhone: true, createdAt: true },
			orderBy: { createdAt: 'asc' },
		})
		return rows
	}

	async dequeueNext(
		tenantId: string,
		departmentName: string
	): Promise<QueueEntry | null> {
		return this.prisma.$transaction(async tx => {
			const dept = await tx.department.findUnique({
				where: { tenantId_name: { tenantId, name: departmentName } },
				select: { id: true },
			})
			if (!dept) return null

			const next = await tx.departmentQueueEntry.findFirst({
				where: { departmentId: dept.id, tenantId },
				orderBy: { createdAt: 'asc' },
				select: { id: true, customerPhone: true, createdAt: true },
			})

			if (!next) return null

			await tx.departmentQueueEntry.delete({ where: { id: next.id } })
			return { customerPhone: next.customerPhone, createdAt: next.createdAt }
		})
	}

	async findCustomerQueueDepartment(
		tenantId: string,
		customerPhone: string
	): Promise<string | null> {
		const row = await this.prisma.departmentQueueEntry.findFirst({
			where: { tenantId, customerPhone },
			select: { department: { select: { name: true } } },
			orderBy: { createdAt: 'asc' },
		})
		return row?.department?.name ?? null
	}

	async leaveQueue(
		tenantId: string,
		departmentName: string,
		customerPhone: string
	): Promise<void> {
		const dept = await this.prisma.department.findUnique({
			where: { tenantId_name: { tenantId, name: departmentName } },
			select: { id: true },
		})
		if (!dept) return
		await this.prisma.departmentQueueEntry.deleteMany({
			where: { tenantId, departmentId: dept.id, customerPhone },
		})
	}

	async create(
		tenantId: string,
		name: string,
		description?: string | null
	): Promise<{ id: string; name: string; description: string | null }> {
		const dept = await this.prisma.department.create({
			data: { tenantId, name, description: description ?? null },
			select: { id: true, name: true, description: true },
		})
		return dept
	}

	async update(
		tenantId: string,
		id: string,
		data: { name?: string; description?: string | null }
	): Promise<{ id: string; name: string; description: string | null }> {
		const dept = await this.prisma.department.update({
			where: { id },
			data,
			select: { id: true, name: true, description: true },
		})
		return dept
	}

	async get(
		tenantId: string,
		id: string
	): Promise<{ id: string; name: string; description: string | null } | null> {
		const dept = await this.prisma.department.findFirst({
			where: { id, tenantId },
			select: { id: true, name: true, description: true },
		})
		return dept ?? null
	}

	async list(
		tenantId: string
	): Promise<{ id: string; name: string; description: string | null }[]> {
		return this.prisma.department.findMany({
			where: { tenantId },
			orderBy: { name: 'asc' },
			select: { id: true, name: true, description: true },
		})
	}

	async remove(tenantId: string, id: string): Promise<void> {
		await this.prisma.employee.updateMany({
			where: { tenantId, departmentId: id },
			data: { departmentId: null },
		})
		await this.prisma.department.delete({ where: { id } })
	}

	async assignEmployee(
		tenantId: string,
		departmentId: string,
		employeeId: string | null
	): Promise<void> {
		if (employeeId === null) {
			// Unassign all employees from this department for the tenant
			await this.prisma.employee.updateMany({
				where: { tenantId, departmentId },
				data: { departmentId: null },
			})
			return
		}
		await this.prisma.employee.update({
			where: { id: employeeId },
			data: { departmentId },
		})
	}

	async replaceEmployees(
		tenantId: string,
		departmentId: string,
		employeeIds: string[]
	): Promise<void> {
		const ids = [...new Set(employeeIds)].filter(Boolean)
		await this.prisma.$transaction(async tx => {
			// Remove employees currently in this department but not in the new list
			await tx.employee.updateMany({
				where: {
					tenantId,
					departmentId,
					...(ids.length ? { id: { notIn: ids } } : {}),
				},
				data: { departmentId: null },
			})
			// Assign all provided employees to this department (moves from others if needed)
			if (ids.length) {
				await tx.employee.updateMany({
					where: { tenantId, id: { in: ids } },
					data: { departmentId },
				})
			}
		})
	}
}
