import { ApplicationError } from '@/errors/application-case-error'

export class UserResolutionError extends Error implements ApplicationError {
	constructor(message = 'Could not resolve user') {
		super(message)
	}
}
