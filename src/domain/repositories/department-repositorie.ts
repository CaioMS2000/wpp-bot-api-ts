import { Department } from '../entities/department'

export abstract class DepartmentRepository {
    abstract findAllActive(): Promise<Department[]>
}
