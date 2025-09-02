import { ApplicationError } from '@/errors/application-case-error'

export class EmployeeNotAssignedToAnyDpartmentError
	extends Error
	implements ApplicationError
{
	constructor(message = 'This agent is not compatible') {
		super(message)
	}
}
