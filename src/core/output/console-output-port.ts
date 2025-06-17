import { OutputPort } from './output-port'

export class ConsoleOutputPort implements OutputPort {
    handle(response: any): void | Promise<void> {
        logger.print('OUTPUT ==========')
        logger.print(response)
        logger.print('==========')
    }
}
