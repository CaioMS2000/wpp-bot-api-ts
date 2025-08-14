import { ApplicationError } from '@/errors/application-case-error'

export class InconsistencyError extends Error implements ApplicationError {
	constructor(message = 'Some inconsistency in the system') {
		super(message)
	}
}
