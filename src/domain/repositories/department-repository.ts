import { Department } from '../entities/department'

export abstract class DepartmentRepository {
    abstract save(department: Department): Promise<void>
    abstract findAllActive(): Promise<Department[]>
}
