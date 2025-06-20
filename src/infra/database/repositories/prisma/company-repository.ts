import { Company } from '@/domain/entities/company'
import { Manager } from '@/domain/entities/manager'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { prisma } from '@/lib/prisma'
import { ManagerMapper } from '../../mapper/manager-mapper'

export class PrismaCompanyRepository extends CompanyRepository {
    async save(company: Company): Promise<void> {
        await prisma.company.upsert({
            where: { id: company.id },
            update: {
                name: company.name,
                phone: company.phone,
                cnpj: company.cnpj,
            },
            create: {
                id: company.id,
                name: company.name,
                phone: company.phone,
                cnpj: company.cnpj,
                managerId: company.manager.id,
            },
        })
    }

    async findByPhone(phone: string): Promise<Nullable<Company>> {
        const model = await prisma.company.findUnique({
            where: { phone },
            include: { manager: true },
        })

        if (!model) return null

        return Company.create(
            {
                name: model.name,
                phone: model.phone,
                cnpj: model.cnpj,
                manager: ManagerMapper.toEntity(model.manager),
            },
            model.id
        )
    }

    async findByCNPJ(cnpj: string): Promise<Nullable<Company>> {
        const model = await prisma.company.findUnique({
            where: { cnpj },
            include: { manager: true },
        })

        if (!model) return null

        return Company.create(
            {
                name: model.name,
                phone: model.phone,
                cnpj: model.cnpj,
                manager: ManagerMapper.toEntity(model.manager),
            },
            model.id
        )
    }
}
