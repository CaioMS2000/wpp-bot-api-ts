import { Employee as PrismaEmployee } from 'ROOT/prisma/generated'
import { Employee } from '@/entities/employee'

export class EmployeeMapper {
	static toEntity(raw: PrismaEmployee): Employee {
		return Employee.create(
			{
				name: raw.name,
				phone: raw.phone,
				companyId: raw.companyId,
				departmentId: raw.departmentId,
			},
			raw.id
		)
	}

	static toModel(entity: Employee): Omit<PrismaEmployee, 'id'> {
		return {
			name: entity.name,
			phone: entity.phone,
			companyId: entity.companyId,
			departmentId: entity.departmentId,
		}
	}
}
