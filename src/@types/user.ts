import { type Client } from '@/entities/client'
import { type Employee } from '@/entities/employee'

export type User = Client | Employee

export enum UserType {
	CLIENT = 'CLIENT',
	EMPLOYEE = 'EMPLOYEE',
}

export enum AgentType {
	AI = 'AI',
	EMPLOYEE = 'EMPLOYEE',
}

export enum SenderType {
	CLIENT = 'CLIENT',
	EMPLOYEE = 'EMPLOYEE',
	AI = 'AI',
	SYSTEM = 'SYSTEM',
}

export type UserUnionType =
	| {
			user: Client
			userType: UserType.CLIENT
	  }
	| {
			user: Employee
			userType: UserType.EMPLOYEE
	  }
