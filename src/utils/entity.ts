import { Client } from '@/domain/entities/client'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { FAQItem } from '@/domain/entities/faq'

export function isClient(user: Client | Employee): user is Client {
    return user instanceof Client
}

export function isEmployee(user: Client | Employee): user is Employee {
    return user instanceof Employee
}

export function isFAQItem(item: unknown): item is FAQItem {
    return (
        typeof item === 'object' &&
        item !== null &&
        'question' in item &&
        'answer' in item &&
        typeof item.question === 'string' &&
        typeof item.answer === 'string'
    )
}

export function isDepartment(data: unknown): data is Department {
    return data instanceof Department
}
export function isDepartmentArray(data: unknown): data is Department[] {
    return Array.isArray(data) && data.every(isDepartment)
}
