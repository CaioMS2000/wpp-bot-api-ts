import { Department } from '@/domain/entities/department'
import {
    BusinessHour as PrismaBusinessHour,
    Client as PrismaClient,
    Company as PrismaCompany,
    Department as PrismaDepartment,
    Employee as PrismaEmployee,
    Manager as PrismaManager,
} from 'ROOT/prisma/generated'
import { ClientMapper } from './client-mapper'
import { CompanyMapper } from './company-mapper'
import { EmployeeMapper } from './employee-mapper'

type DepartmentWithRelations = PrismaDepartment & {
    company: PrismaCompany & {
        businessHours: PrismaBusinessHour[]
        manager: PrismaManager
    }
    employees: PrismaEmployee[]
    queue: PrismaClient[]
}

export class DepartmentMapper {
    static toEntity(raw: DepartmentWithRelations): Department {
        return Department.create(
            {
                name: raw.name,
                description: raw.description || '',
                company: CompanyMapper.toEntity(raw.company),
                employee: raw.employees.map(emp =>
                    EmployeeMapper.toEntity({
                        ...emp,
                        company: raw.company,
                        department: raw,
                    })
                ),
                queue: raw.queue.map(client =>
                    ClientMapper.toEntity({
                        ...client,
                        company: raw.company,
                    })
                ),
            },
            raw.id
        )
    }

    static toModel(entity: Department): Omit<PrismaDepartment, 'id'> {
        return {
            name: entity.name,
            description: entity.description,
            companyId: entity.company.id,
        }
    }
}
