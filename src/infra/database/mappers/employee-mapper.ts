// src/infra/database/mappers/employee-mapper.ts
import {
    Employee as PrismaEmployee,
    Department as PrismaDepartment,
    Company as PrismaCompany,
    Manager as PrismaManager,
    BusinessHour as PrismaBusinessHour,
} from 'ROOT/prisma/generated'
import { Employee } from '@/domain/entities/employee'
import { CompanyMapper } from './company-mapper'
import { DepartmentMapper } from './department-mapper'

type EmployeeWithRelations = PrismaEmployee & {
    company: PrismaCompany & {
        businessHours: PrismaBusinessHour[]
        manager: PrismaManager
    }
    department?:
        | (PrismaDepartment & {
              company: PrismaCompany & {
                  businessHours: PrismaBusinessHour[]
                  manager: PrismaManager
              }
              employees: PrismaEmployee[]
              queue: any[]
          })
        | null
}

export class EmployeeMapper {
    static toEntity(raw: EmployeeWithRelations): Employee {
        return Employee.create(
            {
                name: raw.name,
                phone: raw.phone,
                company: CompanyMapper.toEntity(raw.company),
                department: raw.department
                    ? DepartmentMapper.toEntity(raw.department)
                    : null,
            },
            raw.id
        )
    }

    static toModel(entity: Employee): Omit<PrismaEmployee, 'id'> {
        return {
            name: entity.name,
            phone: entity.phone,
            companyId: entity.company.id,
            departmentId: entity.department?.id || null,
        }
    }
}
