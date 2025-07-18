import { Employee } from '@/domain/entities/employee'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { prisma } from '@/lib/prisma'
import { EmployeeMapper } from '../../mappers/employee-mapper'
import { CompanyRepository } from '@/domain/repositories/company-repository'

export class PrismaEmployeeRepository extends EmployeeRepository {
    private _companyRepository!: CompanyRepository

    set companyRepository(companyRepository: CompanyRepository) {
        this._companyRepository = companyRepository
    }

    get companyRepository() {
        return this._companyRepository
    }

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

    async findByPhone(phone: string): Promise<Nullable<Employee>> {
        const raw = await prisma.employee.findUnique({
            where: { phone },
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

        const company = await this.companyRepository.findOrThrow(raw.companyId)
        const employee = EmployeeMapper.toEntity(raw)
        employee.company = company

        return employee
    }

    async find(id: string): Promise<Nullable<Employee>> {
        const raw = await prisma.employee.findUnique({
            where: { id },
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

        const company = await this.companyRepository.findOrThrow(raw.companyId)
        const employee = EmployeeMapper.toEntity(raw)
        employee.company = company

        return employee
    }

    async findOrThrow(id: string): Promise<Employee> {
        const entity = await this.find(id)

        if (!entity) {
            throw new Error('Employee not found')
        }

        return entity
    }
}
