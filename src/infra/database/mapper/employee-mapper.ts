import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import {
    Company as PrismaCompany,
    Department as PrismaDepartment,
    Employee as PrismaEmployee,
    Manager as PrismaManager,
} from 'ROOT/prisma/generated'
import { CompanyMapper } from './company-mapper'

export class EmployeeMapper {
    static toEntity(
        model: PrismaEmployee,
        companyModel: PrismaCompany,
        managerModel: PrismaManager,
        departmentModel?: PrismaDepartment | null
    ): Employee {
        const employee = Employee.create(
            {
                company: CompanyMapper.toEntity({
                    ...companyModel,
                    manager: managerModel,
                }),
                phone: model.phone,
                name: model.name,
            },
            model.id
        )

        if (departmentModel) {
            const department = Department.create(
                {
                    name: departmentModel.name,
                    company: employee.company,
                },
                departmentModel.id
            )
            employee.department = department
        }

        return employee
    }

    static toModel(employee: Employee): PrismaEmployee {
        return {
            id: employee.id,
            phone: employee.phone,
            name: employee.name,
            companyId: employee.company.id,
            departmentId: employee.department?.id ?? null,
        }
    }
}
