import { ApplicationError } from '@/errors/application-case-error'

export class ResourceNotFoundError extends Error implements ApplicationError {
	constructor(message = 'Resource not found') {
		super(message)
	}
}
