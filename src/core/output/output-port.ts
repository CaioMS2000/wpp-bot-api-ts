import { UserType } from '@/domain/whats-app/@types'

export type OutputPort = {
    handle(toUser: UserType, message: string): void | Promise<void>
}
