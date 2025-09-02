import { ApplicationError } from '@/errors/application-case-error'

export class ConversationResolutionError
	extends Error
	implements ApplicationError
{
	constructor(message = 'Invalid conversation') {
		super(message)
	}
}
