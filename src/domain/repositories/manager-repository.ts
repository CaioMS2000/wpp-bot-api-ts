import { Manager } from '../entities/manager'

export abstract class ManagerRepository {
    abstract save(manager: Manager): Promise<void>
    abstract findByEmail(email: string): Promise<Nullable<Manager>>
    abstract findOrThrow(id: string): Promise<Manager>
}
