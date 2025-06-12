import { OutputPort } from './output-port'

export class ConsoleOutputPort implements OutputPort {
    handle(response: any): void | Promise<void> {
        console.log('OUTPUT ==========')
        console.log(response)
        console.log('==========')
    }
}
