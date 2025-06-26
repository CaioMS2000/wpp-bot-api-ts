import path from 'node:path'
import { appendToJsonObject, findProjectRoot } from '@/utils/files'
import { OutputPort } from './output-port'
import { UserType } from '@/domain/whats-app/@types'

export class FileOutputPort implements OutputPort {
    handle(toUser: UserType, message: string): void | Promise<void> {
        const projectRoot = findProjectRoot(__dirname)
        const responseFilePath = path.join(projectRoot, 'response.json')

        appendToJsonObject(responseFilePath, {
            to: toUser.phone,
            message,
        })
    }
}
