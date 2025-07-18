import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Department } from '@/domain/entities/department'
import type { Employee } from '@/domain/entities/employee'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { prisma } from '@/lib/prisma'
import { DepartmentMapper } from '../../mappers/department-mapper'

export class PrismaDepartmentRepository extends DepartmentRepository {
    private _clientRepository!: ClientRepository
    private _employeeRepository!: EmployeeRepository

    set clientRepository(clientRepository: ClientRepository) {
        this._clientRepository = clientRepository
    }

    get clientRepository() {
        return this._clientRepository
    }

    set employeeRepository(employeeRepository: EmployeeRepository) {
        this._employeeRepository = employeeRepository
    }

    get employeeRepository() {
        return this._employeeRepository
    }

    async save(department: Department): Promise<void> {
        const data = DepartmentMapper.toModel(department)

        await prisma.department.upsert({
            where: { id: department.id },
            update: data,
            create: {
                ...data,
                id: department.id,
            },
        })
    }

    async find(company: Company, id: string): Promise<Nullable<Department>> {
        const raw = await prisma.department.findUnique({
            where: { id, companyId: company.id },
            include: {
                queue: {
                    include: {
                        client: true,
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
                company: {
                    include: {
                        manager: true,
                        businessHours: true,
                    },
                },
                employees: true,
            },
        })

        if (!raw) return null

        const department = DepartmentMapper.toEntity(raw)
        department.company = company

        // Preencher employees
        const employees = await Promise.all(
            raw.employees.map(e => this.employeeRepository.find(e.id))
        )
        department.employees = employees.filter((e): e is Employee =>
            Boolean(e)
        )

        // Preencher queue mantendo a ordem original
        const clients = await Promise.all(
            raw.queue.map(q => this.clientRepository.find(company, q.clientId))
        )
        department.queue = clients.filter((c): c is Client => Boolean(c))

        return department
    }

    async findByName(
        company: Company,
        name: string
    ): Promise<Nullable<Department>> {
        const raw = await prisma.department.findFirst({
            where: {
                name,
                companyId: company.id,
            },
            include: {
                company: {
                    include: {
                        manager: true,
                        businessHours: true,
                    },
                },
                employees: true,
                queue: {
                    include: {
                        client: true,
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
        })

        if (!raw) return null

        const department = DepartmentMapper.toEntity(raw)
        department.company = company

        // Preencher employees
        const employees = await Promise.all(
            raw.employees.map(e => this.employeeRepository.find(e.id))
        )
        department.employees = employees.filter((e): e is Employee =>
            Boolean(e)
        )

        // Preencher queue mantendo a ordem original
        const clients = await Promise.all(
            raw.queue.map(q => this.clientRepository.find(company, q.clientId))
        )
        department.queue = clients.filter((c): c is Client => Boolean(c))

        return department
    }

    async findByNameOrThrow(
        company: Company,
        name: string
    ): Promise<Department> {
        const department = await this.findByName(company, name)
        if (!department) {
            throw new Error(
                `Department "${name}" not found for company ${company.id}`
            )
        }
        return department
    }

    async findAllActive(company: Company): Promise<Department[]> {
        const departments: Department[] = []
        const rawDepartments = await prisma.department.findMany({
            where: {
                companyId: company.id,
            },
            include: {
                company: {
                    include: {
                        manager: true,
                        businessHours: true,
                    },
                },
                employees: true,
                queue: {
                    include: {
                        client: true,
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
        })

        for (const rawDepartment of rawDepartments) {
            const department = DepartmentMapper.toEntity(rawDepartment)
            department.company = company

            // Preencher employees
            const employees = await Promise.all(
                rawDepartment.employees.map(e =>
                    this.employeeRepository.find(e.id)
                )
            )
            department.employees = employees.filter((e): e is Employee =>
                Boolean(e)
            )

            // Preencher queue mantendo a ordem original
            const clients = await Promise.all(
                rawDepartment.queue.map(q =>
                    this.clientRepository.find(company, q.clientId)
                )
            )
            department.queue = clients.filter((c): c is Client => Boolean(c))

            departments.push(department)
        }

        return departments
    }

    async insertClientIntoQueue(
        department: Department,
        client: Client
    ): Promise<void> {
        await prisma.department.update({
            where: {
                id: department.id,
            },
            data: {
                queue: {
                    connect: { id: client.id },
                },
            },
        })
    }

    async removeClientFromQueue(
        department: Department,
        client: Client
    ): Promise<void> {
        await prisma.department.update({
            where: {
                id: department.id,
            },
            data: {
                queue: {
                    disconnect: { id: client.id },
                },
            },
        })
    }

    async getClientPositionInQueue(
        department: Department,
        client: Client
    ): Promise<Nullable<number>> {
        const queue = await prisma.departmentQueue.findMany({
            where: {
                departmentId: department.id,
                clientId: client.id,
                leftAt: null,
            },
            orderBy: {
                joinedAt: 'asc',
            },
        })

        if (queue.length === 0) {
            return null
        }
        const index = queue.findIndex(q => q.clientId === client.id)

        return index >= 0 ? index : null
    }

    async getNextClientFromQueue(
        department: Department
    ): Promise<Nullable<string>> {
        const queue = await prisma.departmentQueue.findMany({
            where: {
                departmentId: department.id,
                leftAt: null,
            },
            orderBy: {
                joinedAt: 'asc',
            },
        })

        if (queue.length === 0) {
            return null
        }

        const queueItem = queue[0]

        return queueItem.clientId
    }
}
