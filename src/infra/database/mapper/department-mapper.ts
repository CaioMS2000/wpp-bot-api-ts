import { Department } from '@/domain/entities/department'
import {
    Client as PrismaClient,
    Company as PrismaCompany,
    Department as PrismaDepartment,
    Employee as PrismaEmployee,
    Manager as PrismaManager,
} from 'ROOT/prisma/generated'
import { ClientMapper } from './client-mapper'
import { CompanyMapper } from './company-mapper'
import { EmployeeMapper } from './employee-mapper'

export class DepartmentMapper {
    static toEntity(
        model: PrismaDepartment & {
            company: PrismaCompany & { manager: PrismaManager }
            queue: PrismaClient[]
            employees: PrismaEmployee[]
        }
    ): Department {
        const companyEntity = CompanyMapper.toEntity(model.company)

        const queueEntities = model.queue.map(client =>
            ClientMapper.toEntity(client, model.company, model.company.manager)
        )

        const employeeEntities = model.employees.map(employee =>
            EmployeeMapper.toEntity(
                employee,
                model.company,
                model.company.manager
            )
        )

        const department = Department.create(
            {
                name: model.name,
                company: companyEntity,
            },
            model.id
        )

        department.queue.push(...queueEntities)
        department.employee.push(...employeeEntities)

        return department
    }

    static toModel(department: Department): PrismaDepartment {
        return {
            id: department.id,
            name: department.name,
            description: department.description,
            companyId: department.company.id,
        }
    }
}
