import { Employee } from '@/domain/entities/employee'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { prisma } from '@/lib/prisma'
import { EmployeeMapper } from '../../mapper/employee-mapper'

export class PrismaEmployeeRepository extends EmployeeRepository {
    async save(employee: Employee): Promise<void> {
        await prisma.employee.upsert({
            where: { id: employee.id },
            update: {
                name: employee.name,
                phone: employee.phone,
                companyId: employee.company.id,
                departmentId: employee.department?.id ?? null,
            },
            create: {
                id: employee.id,
                name: employee.name,
                phone: employee.phone,
                companyId: employee.company.id,
                departmentId: employee.department?.id ?? null,
            },
        })
    }

    async findByPhone(phone: string): Promise<Nullable<Employee>> {
        const model = await prisma.employee.findUnique({
            where: { phone },
            include: {
                company: { include: { manager: true } },
                department: true,
            },
        })

        if (!model) return null

        return EmployeeMapper.toEntity(
            model,
            model.company,
            model.company.manager
        )
    }
}
