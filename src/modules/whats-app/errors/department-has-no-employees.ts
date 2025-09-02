import { ApplicationError } from '@/errors/application-case-error'

export class DepartmentHasNoEmployeesError
	extends Error
	implements ApplicationError
{
	constructor(message = 'Department has no employees') {
		super(message)
	}
}
