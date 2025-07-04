import { Client } from '@/domain/entities/client'
import { Department } from '@/domain/entities/department'
import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class RemoveClientFromDepartmentQueue {
    constructor(private departmentRepository: DepartmentRepository) {}

    async execute(department: Department, client: Client) {
        await this.departmentRepository.insertClientIntoQueue(
            department,
            client
        )
    }
}
