import path from 'node:path'
import { OutputPort } from './output-port'
import { appendToJsonObject, findProjectRoot } from '@/utils/files'

export class FileOutputPort implements OutputPort {
    handle(response: any): void | Promise<void> {
        const projectRoot = findProjectRoot(__dirname)
        const responseFilePath = path.join(projectRoot, 'response.json')

        appendToJsonObject(
            responseFilePath,
            response as Record<string, unknown>
        )
    }
}
