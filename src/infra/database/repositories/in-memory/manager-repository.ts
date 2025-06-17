import { Manager } from '@/domain/entities/manager'
import { ManagerRepository } from '@/domain/repositories/manager-repository'

export class InMemoryManagerRepository extends ManagerRepository {
    private data: Record<string, Manager> = {}

    constructor() {
        super()

        this.seedInMemoryData()
    }

    async save(manager: Manager): Promise<void> {
        this.data[manager.email] = manager
    }

    async findByEmail(email: string): Promise<Nullable<Manager>> {
        return this.data[email] ?? null
    }

    private async seedInMemoryData() {
        this.save(
            Manager.create({
                name: 'Eugenio Garcia',
                email: 'manager@evolight.com',
            })
        )
    }
}
