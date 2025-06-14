import { Client } from '@/domain/entities/client'
import { Employee } from '@/domain/entities/employee'

export function isClient(user: Client | Employee): user is Client {
    return user instanceof Client
}

export function isEmployee(user: Client | Employee): user is Employee {
    return user instanceof Employee
}
