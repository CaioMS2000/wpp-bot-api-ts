import { Company } from '@/domain/entities/company'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { CompanyMapper } from '../../mappers/company-mapper'
import { prisma } from '@/lib/prisma'

export class PrismaCompanyRepository extends CompanyRepository {
    async save(company: Company): Promise<void> {
        const data = CompanyMapper.toModel(company)
        const businessHours = CompanyMapper.businessHoursToModel(company)

        await prisma.$transaction(async tx => {
            await tx.company.upsert({
                where: { id: company.id },
                update: data,
                create: {
                    ...data,
                    id: company.id,
                },
            })

            // Atualiza businessHours removendo os antigos e inserindo os novos
            await tx.businessHour.deleteMany({
                where: { companyId: company.id },
            })

            await tx.businessHour.createMany({
                data: businessHours,
            })
        })
    }

    async findByPhone(phone: string): Promise<Nullable<Company>> {
        const raw = await prisma.company.findUnique({
            where: { phone },
            include: {
                manager: true,
                businessHours: true,
            },
        })

        if (!raw) return null
        return CompanyMapper.toEntity(raw)
    }

    async findByCNPJ(cnpj: string): Promise<Nullable<Company>> {
        const raw = await prisma.company.findUnique({
            where: { cnpj },
            include: {
                manager: true,
                businessHours: true,
            },
        })

        if (!raw) return null
        return CompanyMapper.toEntity(raw)
    }
}
