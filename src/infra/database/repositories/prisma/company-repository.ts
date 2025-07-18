import { Company } from '@/domain/entities/company'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { CompanyMapper } from '../../mappers/company-mapper'
import { prisma } from '@/lib/prisma'
import { ManagerRepository } from '@/domain/repositories/manager-repository'

export class PrismaCompanyRepository extends CompanyRepository {
    private _managerRepository!: ManagerRepository

    set managerRepository(managerRepository: ManagerRepository) {
        this._managerRepository = managerRepository
    }

    get managerRepository() {
        return this._managerRepository
    }

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

    async find(id: string): Promise<Nullable<Company>> {
        const raw = await prisma.company.findUnique({
            where: { id },
            include: {
                manager: true,
                businessHours: true,
            },
        })

        if (!raw) return null

        const manager = await this.managerRepository.findOrThrow(raw.managerId)

        const company = CompanyMapper.toEntity(raw)
        company.manager = manager

        return company
    }

    async findOrThrow(id: string): Promise<Company> {
        const company = await this.find(id)
        if (!company) {
            throw new Error(`Company with id ${id} not found`)
        }
        return company
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

        const manager = await this.managerRepository.findOrThrow(raw.managerId)

        const company = CompanyMapper.toEntity(raw)

        company.manager = manager

        return company
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

        const manager = await this.managerRepository.findOrThrow(raw.managerId)

        const company = CompanyMapper.toEntity(raw)

        company.manager = manager

        return company
    }

    async findByManagerId(managerId: string): Promise<Nullable<Company>> {
        const raw = await prisma.company.findUnique({
            where: { managerId },
            include: {
                manager: true,
                businessHours: true,
            },
        })

        if (!raw) return null

        return CompanyMapper.toEntity(raw)
    }
}
