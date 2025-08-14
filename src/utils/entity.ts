import { Client } from '@/entities/client'
import { Department } from '@/entities/department'
import { Employee } from '@/entities/employee'
import { FAQItem } from '@/entities/faq-item'
import { User } from '@/@types'

// export function isClient(user: Client | Employee): user is Client {
// export function isClient(user: unknown): user is Client {
export function isClient(user: User): user is Client {
	return user.__name__ === 'Client'
}

// export function isEmployee(user: Client | Employee): user is Employee {
// export function isEmployee(user: unknown): user is Employee {
export function isEmployee(user: User): user is Employee {
	return user.__name__ === 'Employee'
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
