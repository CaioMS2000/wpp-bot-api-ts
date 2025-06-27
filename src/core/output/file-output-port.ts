import path from 'node:path'
import { UserType } from '@/domain/whats-app/@types'
import { appendToJsonObject, findProjectRoot } from '@/utils/files'
import { logger } from '../logger'
import { OutputPort } from './output-port'

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
