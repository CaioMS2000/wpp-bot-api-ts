import { Entity } from '@/core/entities/entity'
import type { Client } from './client'
import { Company } from './company'
import type { Employee } from './employee'

export type DepartmentProps = {
    name: string
    description: string
    companyId: string
    company: Company
    queue: Client[]
    employees: Employee[]
}

export class Department extends Entity<DepartmentProps> {
    private static readonly TEMPORARY_COMPANY = Symbol(
        'TEMPORARY_COMPANY'
    ) as unknown as Company
    static create(
        props: RequireOnly<DepartmentProps, 'name' | 'companyId'>,
        id?: string
    ) {
        const defaults: Omit<DepartmentProps, 'name' | 'companyId'> = {
            queue: [],
            employees: [],
            description: '',
            company: Department.TEMPORARY_COMPANY,
        }
        const department = new Department({ ...defaults, ...props }, id)
        return department
    }

    get name() {
        return this.props.name
    }

    get queue() {
        return this.props.queue
    }

    get employees() {
        return this.props.employees
    }

    get company() {
        if (
            this.props.company === Department.TEMPORARY_COMPANY ||
            !this.props.company
        ) {
            throw new Error(
                "Company is not set. Use the setter to set the company or use 'companyId'."
            )
        }
        return this.props.company
    }

    get description() {
        return this.props.description
    }

    set queue(value: Client[]) {
        this.props.queue = value
    }

    set employees(value: Employee[]) {
        this.props.employees = value
    }

    set company(value: Company) {
        this.props.company = value
    }
}
