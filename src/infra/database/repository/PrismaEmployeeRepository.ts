import {
	Employee,
	EmployeeRepository,
	EmployeeFull,
} from '@/repository/EmployeeRepository'
import { PrismaClient } from '@prisma/client'

export class PrismaEmployeeRepository implements EmployeeRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findByPhone(tenantId: string, phone: string): Promise<Employee | null> {
		const row = await this.prisma.employee.findUnique({
			where: { tenantId_phone: { tenantId, phone } },
			select: {
				name: true,
				phone: true,
				department: { select: { name: true } },
			},
		})

		if (!row) return null

		return {
			name: row.name,
			phone: row.phone,
			departmentName: row.department?.name ?? null,
		}
	}

	async create(
		tenantId: string,
		name: string,
		phone: string,
		departmentName?: string | null
	): Promise<EmployeeFull> {
		let departmentId: string | undefined
		if (departmentName) {
			const dept = await this.prisma.department.upsert({
				where: { tenantId_name: { tenantId, name: departmentName } },
				update: {},
				create: { tenantId, name: departmentName },
				select: { id: true },
			})
			departmentId = dept.id
		}
		const row = await this.prisma.employee.create({
			data: { tenantId, name, phone, departmentId },
			select: {
				id: true,
				name: true,
				phone: true,
				department: { select: { name: true } },
			},
		})
		return {
			id: row.id,
			name: row.name,
			phone: row.phone,
			departmentName: row.department?.name ?? null,
		}
	}

	async update(
		tenantId: string,
		id: string,
		data: { name?: string; phone?: string; departmentName?: string | null }
	): Promise<EmployeeFull> {
		let departmentId: string | undefined | null
		if (data.departmentName !== undefined) {
			if (data.departmentName === null) departmentId = null
			else {
				const dept = await this.prisma.department.upsert({
					where: { tenantId_name: { tenantId, name: data.departmentName } },
					update: {},
					create: { tenantId, name: data.departmentName },
					select: { id: true },
				})
				departmentId = dept.id
			}
		}
		const updateData: {
			name?: string
			phone?: string
			departmentId?: string | null
		} = {
			name: data.name ?? undefined,
			phone: data.phone ?? undefined,
		}
		if (departmentId !== undefined) updateData.departmentId = departmentId
		const row = await this.prisma.employee.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
				name: true,
				phone: true,
				department: { select: { name: true } },
			},
		})
		return {
			id: row.id,
			name: row.name,
			phone: row.phone,
			departmentName: row.department?.name ?? null,
		}
	}

	async get(tenantId: string, id: string): Promise<EmployeeFull | null> {
		const row = await this.prisma.employee.findFirst({
			where: { id, tenantId },
			select: {
				id: true,
				name: true,
				phone: true,
				department: { select: { name: true } },
			},
		})
		if (!row) return null
		return {
			id: row.id,
			name: row.name,
			phone: row.phone,
			departmentName: row.department?.name ?? null,
		}
	}

	async list(tenantId: string): Promise<EmployeeFull[]> {
		const rows = await this.prisma.employee.findMany({
			where: { tenantId },
			orderBy: { name: 'asc' },
			select: {
				id: true,
				name: true,
				phone: true,
				department: { select: { name: true } },
			},
		})
		return rows.map(r => ({
			id: r.id,
			name: r.name,
			phone: r.phone,
			departmentName: r.department?.name ?? null,
		}))
	}

	async listByDepartment(
		tenantId: string,
		departmentId: string
	): Promise<EmployeeFull[]> {
		const rows = await this.prisma.employee.findMany({
			where: { tenantId, departmentId },
			orderBy: { name: 'asc' },
			select: {
				id: true,
				name: true,
				phone: true,
				department: { select: { name: true } },
			},
		})
		return rows.map(r => ({
			id: r.id,
			name: r.name,
			phone: r.phone,
			departmentName: r.department?.name ?? null,
		}))
	}

	async remove(_tenantId: string, id: string): Promise<void> {
		await this.prisma.employee.delete({ where: { id } })
	}
}
