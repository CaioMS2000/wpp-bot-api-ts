import { Company } from '@/domain/entities/company'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { prisma } from '@/lib/prisma'
import { CompanyMapper } from '../../mapper/company-mapper'

export class PrismaCompanyRepository extends CompanyRepository {
    async save(company: Company): Promise<void> {
        await prisma.company.upsert({
            where: { id: company.id },
            update: {
                name: company.name,
                phone: company.phone,
                cnpj: company.cnpj,
                email: company.email,
                website: company.website,
                description: company.description,
                managerId: company.manager.id,
            },
            create: {
                id: company.id,
                name: company.name,
                phone: company.phone,
                cnpj: company.cnpj,
                email: company.email,
                website: company.website,
                description: company.description,
                managerId: company.manager.id,
            },
        })

        // Remove horários antigos e recria com os atuais
        await prisma.businessHour.deleteMany({
            where: { companyId: company.id },
        })

        await prisma.businessHour.createMany({
            data: CompanyMapper.businessHoursToModels(company),
        })
    }

    async findByPhone(phone: string): Promise<Nullable<Company>> {
        const model = await prisma.company.findUnique({
            where: { phone },
            include: {
                manager: true,
                businessHours: true,
            },
        })

        if (!model) return null

        return CompanyMapper.toEntity(model)
    }

    async findByCNPJ(cnpj: string): Promise<Nullable<Company>> {
        const model = await prisma.company.findUnique({
            where: { cnpj },
            include: {
                manager: true,
                businessHours: true,
            },
        })

        if (!model) return null

        return CompanyMapper.toEntity(model)
    }
}
