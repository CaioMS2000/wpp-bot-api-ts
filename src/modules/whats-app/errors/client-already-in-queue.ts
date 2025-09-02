import { ApplicationError } from '@/errors/application-case-error'

export class ClientAlreadyInQueueError
	extends Error
	implements ApplicationError
{
	constructor(message = 'Client already in queue') {
		super(message)
	}
}
