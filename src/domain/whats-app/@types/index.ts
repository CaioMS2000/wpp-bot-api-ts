import { type Client } from '@/domain/entities/client'
import { type Employee } from '@/domain/entities/employee'

export type MenuOption = {
	key: string
	label: string
	forClient: boolean
	forEmployee: boolean
}

export type User = Client | Employee

// biome-ignore lint/style/useEnumInitializers: Permitir membros implicitamente inicializados
export enum UserType {
	CLIENT,
	EMPLOYEE,
}

// biome-ignore lint/style/useEnumInitializers: Permitir membros implicitamente inicializados
export enum AgentType {
	AI,
	EMPLOYEE,
}

// biome-ignore lint/style/useEnumInitializers: Permitir membros implicitamente inicializados
export enum SenderType {
	CLIENT,
	EMPLOYEE,
	AI,
}
