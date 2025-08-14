import { User } from '@/@types'
import { UserType } from '@/@types'
import { Client } from '@/entities/client'
import { Company } from '@/entities/company'
import { Conversation } from '@/entities/conversation'
import { Department } from '@/entities/department'
import { Employee } from '@/entities/employee'
import { FAQCategory } from '@/entities/faq-category'
import { ConversationStateType } from '.'

export type StateDataType =
	| {
			target: ConversationStateType.CHATTING_WITH_EMPLOYEE
			data: { employee: Employee; client: Client; department: Department }
	  }
	| {
			target: ConversationStateType.DEPARTMENT_QUEUE
			data: { client: Client; department: Department }
	  }
	| {
			target: ConversationStateType.CHATTING_WITH_CLIENT
			data: {
				employee: Employee
				department: Department
				client: Client
				company: Company
			}
	  }
	| {
			target: ConversationStateType.LISTING_DEPARTMENT_QUEUE
			data: { employee: Employee; department: Department }
	  }
	| {
			target: ConversationStateType.LISTING_FAQ_ITEMS
			data: { user: User; category: FAQCategory }
	  }
	| {
			target: ConversationStateType.CHATTING_WITH_AI
			data: { conversation: Conversation; user: User }
	  }
	| {
			target: ConversationStateType.SELECTING_DEPARTMENT
			data: {
				client: Client
				activeDepartments: Department[]
			}
	  }
	| {
			target: ConversationStateType.SELECTING_FAQ_CATEGORY
			data: { user: User; categories: FAQCategory[] }
	  }
	| {
			target: ConversationStateType.INITIAL_MENU
			data: { user: User; company: Company; conversation: Conversation }
	  }
	| {
			target: ConversationStateType.BEGIN
			data: { user: User; company: Company; conversation: Conversation }
	  }

export type StateParamType =
	| {
			target: ConversationStateType.CHATTING_WITH_EMPLOYEE
			context: {
				clientPhone: string
				departmentId: string
				companyId: string
			}
	  }
	| {
			target: ConversationStateType.DEPARTMENT_QUEUE
			context: {
				clientPhone: string
				departmentId: string
				companyId: string
			}
	  }
	| {
			target: ConversationStateType.CHATTING_WITH_CLIENT
			context: {
				clientPhone: string
				departmentId: string
				companyId: string
			}
	  }
	| {
			target: ConversationStateType.LISTING_DEPARTMENT_QUEUE
			context: { departmentId: string; companyId: string }
	  }
	| {
			target: ConversationStateType.LISTING_FAQ_ITEMS
			context: {
				userId: string
				userType: UserType
				categoryId: string
				companyId: string
			}
	  }
	| {
			target: ConversationStateType.CHATTING_WITH_AI
			context: { userId: string; userType: UserType; companyId: string }
	  }
	| {
			target: ConversationStateType.SELECTING_DEPARTMENT
			context: {
				clientPhone: string
				companyId: string
			}
	  }
	| {
			target: ConversationStateType.SELECTING_FAQ_CATEGORY
			context: { userId: string; userType: UserType; companyId: string }
	  }
	| {
			target: ConversationStateType.INITIAL_MENU
			context: { userId: string; userType: UserType; companyId: string }
	  }
	| {
			target: ConversationStateType.BEGIN
			context: { userId: string; userType: UserType; companyId: string }
	  }
