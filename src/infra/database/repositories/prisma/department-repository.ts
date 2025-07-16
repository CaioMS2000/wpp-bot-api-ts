import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Department } from '@/domain/entities/department'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { prisma } from '@/lib/prisma'
import { DepartmentMapper } from '../../mappers/department-mapper'

export class PrismaDepartmentRepository extends DepartmentRepository {
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

        return DepartmentMapper.toEntity({
            ...raw,
            queue: raw.queue.map(q => ({
                ...q.client,
            })),
        })
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
                },
            },
        })

        if (!raw) return null
        return DepartmentMapper.toEntity({
            ...raw,
            queue: raw.queue.map(q => ({
                ...q.client,
            })),
        })
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
        const departments = await prisma.department.findMany({
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
                },
            },
        })

        return departments.map(raw =>
            DepartmentMapper.toEntity({
                ...raw,
                queue: raw.queue.map(q => ({
                    ...q.client,
                })),
            })
        )
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
