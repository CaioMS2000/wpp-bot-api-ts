import { prisma } from '@/lib/prisma'
import { Manager } from '@/domain/entities/manager'
import { ManagerRepository } from '@/domain/repositories/manager-repository'
import { ManagerMapper } from '../../mappers/manager-mapper'
import { CompanyRepository } from '@/domain/repositories/company-repository'

export class PrismaManagerRepository extends ManagerRepository {
    private _companyRepository!: CompanyRepository

    set companyRepository(companyRepository: CompanyRepository) {
        this._companyRepository = companyRepository
    }

    get companyRepository() {
        return this._companyRepository
    }

    async save(manager: Manager): Promise<void> {
        const data = ManagerMapper.toModel(manager)

        await prisma.manager.upsert({
            where: { id: manager.id },
            update: data,
            create: {
                ...data,
                id: manager.id,
            },
        })
    }

    async findByEmail(email: string): Promise<Nullable<Manager>> {
        const raw = await prisma.manager.findUnique({
            where: { email },
        })

        if (!raw) return null

        const manager = ManagerMapper.toEntity(raw)
        const company = await this.companyRepository.findByManagerId(manager.id)

        if (company) {
            manager.company = company
            company.manager = manager
        }

        return manager
    }

    async findOrThrow(id: string): Promise<Manager> {
        const raw = await prisma.manager.findUniqueOrThrow({
            where: { id },
        })

        const manager = ManagerMapper.toEntity(raw)
        const company = await this.companyRepository.findByManagerId(manager.id)

        if (company) {
            manager.company = company
            company.manager = manager
        }

        return manager
    }
}
