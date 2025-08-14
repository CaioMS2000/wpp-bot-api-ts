import { logger } from '../logger'
import { OutputPort } from './output-port'

export class ConsoleOutputPort implements OutputPort {
	handle(response: any): void | Promise<void> {
		logger.info('OUTPUT ==========', response, '==========')
	}
}
