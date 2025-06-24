import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Department } from '@/domain/entities/department'
import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class InsertClientIntoDepartmentQueue {
    constructor(private departmentRepository: DepartmentRepository) {}

    async execute(department: Department, client: Client) {
        logger.print('Inserting client into department queue...')
        await this.departmentRepository.insertClientIntoQueue(
            department,
            client
        )
    }
}
