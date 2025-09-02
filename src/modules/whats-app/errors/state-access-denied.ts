import { ApplicationError } from '@/errors/application-case-error'

export class StateAccessDeniedError extends Error implements ApplicationError {
	constructor(
		message = 'Access to this state is not allowed for your profile'
	) {
		super(message)
	}
}
