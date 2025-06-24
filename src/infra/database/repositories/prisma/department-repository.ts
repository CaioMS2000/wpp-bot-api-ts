import { Department } from '@/domain/entities/department'
import { Client } from '@/domain/entities/client'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { prisma } from '@/lib/prisma'
import { DepartmentMapper } from '../../mapper/department-mapper'
import { Company } from '@/domain/entities/company'

export class PrismaDepartmentRepository extends DepartmentRepository {
    async save(department: Department): Promise<void> {
        await prisma.department.upsert({
            where: { id: department.id },
            update: {
                name: department.name,
                companyId: department.company.id,
                // relações queue/employees devem ser manipuladas separadamente
            },
            create: {
                id: department.id,
                name: department.name,
                companyId: department.company.id,
            },
        })

        // Atualiza a fila (queue) e os funcionários (employees) manualmente
        await prisma.department.update({
            where: { id: department.id },
            data: {
                queue: {
                    set: department.queue.map(client => ({ id: client.id })),
                },
                employees: {
                    set: department.employee.map(emp => ({ id: emp.id })),
                },
            },
        })
    }

    async findAllActive(company: Company): Promise<Department[]> {
        const models = await prisma.department.findMany({
            where: {
                companyId: company.id,
            },
            include: {
                company: { include: { manager: true } },
                queue: true,
                employees: true,
            },
        })

        return models.map(DepartmentMapper.toEntity)
    }

    async insertClientIntoQueue(
        department: Department,
        client: Client
    ): Promise<void> {
        await prisma.department.update({
            where: { id: department.id },
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
            where: { id: department.id },
            data: {
                queue: {
                    disconnect: { id: client.id },
                },
            },
        })
    }
}
