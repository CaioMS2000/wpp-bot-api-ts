import { Employee } from '@/domain/entities/employee'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { prisma } from '@/lib/prisma'
import { EmployeeMapper } from '../../mappers/employee-mapper'

export class PrismaEmployeeRepository extends EmployeeRepository {
	async save(employee: Employee): Promise<void> {
		const data = EmployeeMapper.toModel(employee)

		await prisma.employee.upsert({
			where: { id: employee.id },
			update: data,
			create: {
				...data,
				id: employee.id,
			},
		})
	}

	async findByPhone(
		companyId: string,
		phone: string
	): Promise<Nullable<Employee>> {
		const raw = await prisma.employee.findUnique({
			where: { phone, companyId },
			include: {
				company: {
					include: {
						manager: true,
						businessHours: true,
					},
				},
				department: {
					include: {
						company: {
							include: {
								manager: true,
								businessHours: true,
							},
						},
						employees: true,
						queue: true,
					},
				},
			},
		})

		if (!raw) return null

		const employee = EmployeeMapper.toEntity(raw)

		return employee
	}

	async find(companyId: string, id: string): Promise<Nullable<Employee>> {
		const raw = await prisma.employee.findUnique({
			where: { id, companyId },
			include: {
				company: {
					include: {
						manager: true,
						businessHours: true,
					},
				},
				department: {
					include: {
						company: {
							include: {
								manager: true,
								businessHours: true,
							},
						},
						employees: true,
						queue: true,
					},
				},
			},
		})

		if (!raw) return null

		const employee = EmployeeMapper.toEntity(raw)

		return employee
	}

	async findOrThrow(companyId: string, id: string): Promise<Employee> {
		const entity = await this.find(companyId, id)

		if (!entity) {
			throw new Error('Employee not found')
		}

		return entity
	}

	async findAllByCompany(companyId: string): Promise<Employee[]> {
		const raw = await prisma.employee.findMany({
			where: { companyId },
		})

		return raw.map(EmployeeMapper.toEntity)
	}

	async findAllByDepartment(
		companyId: string,
		departmentId: string
	): Promise<Employee[]> {
		const raw = await prisma.employee.findMany({
			where: { companyId, departmentId },
		})

		return raw.map(EmployeeMapper.toEntity)
	}
}
