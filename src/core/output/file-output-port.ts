import path from 'node:path'
import { UserType } from '@/domain/whats-app/@types'
import { appendToJsonObject, findProjectRoot } from '@/utils/files'
import { logger } from '../logger'
import { OutputMessage, OutputPort } from './output-port'

export class FileOutputPort implements OutputPort {
    handle(toUser: UserType, output: OutputMessage): void {
        if (output.type !== 'text') {
            throw new Error(
                `FileOutputPort não suporta mensagens do tipo '${output.type}'`
            )
        }
        const projectRoot = findProjectRoot(__dirname)
        const responseFilePath = path.join(projectRoot, 'response.json')

        appendToJsonObject(responseFilePath, {
            to: toUser.phone,
            message: output.content,
        })
        logger.debug(
            `Output appended for ${toUser.phone} -> ${responseFilePath}`
        )
    }
}
