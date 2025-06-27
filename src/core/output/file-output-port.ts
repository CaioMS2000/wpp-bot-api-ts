import path from 'node:path'
import { appendToJsonObject, findProjectRoot } from '@/utils/files'
import { OutputPort } from './output-port'
import { UserType } from '@/domain/whats-app/@types'
import { logger } from '../logger'

export class FileOutputPort implements OutputPort {
    handle(toUser: UserType, message: string): void | Promise<void> {
        const projectRoot = findProjectRoot(__dirname)
        const responseFilePath = path.join(projectRoot, 'response.json')

        appendToJsonObject(responseFilePath, {
            to: toUser.phone,
            message,
        })

        logger.debug(
            `Output appended for ${toUser.phone} -> ${responseFilePath}`
        )
    }
}
