import { ApplicationError } from '@/errors/application-case-error'

export class InvalidMenuOptionError extends Error implements ApplicationError {
	constructor(message = 'Invalid menu option') {
		super(message)
	}
}
