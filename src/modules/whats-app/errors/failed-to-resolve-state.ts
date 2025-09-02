import { ApplicationError } from '@/errors/application-case-error'

export class FailedToResolveStateError
	extends Error
	implements ApplicationError
{
	constructor(message = 'State not resolved') {
		super(message)
	}
}
