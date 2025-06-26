import { Client } from '@/domain/entities/client'
import { Employee } from '@/domain/entities/employee'

export type MenuOption = {
    key: string
    label: string
    forClient: boolean
    forEmployee: boolean
}

export type UserType = Client | Employee
