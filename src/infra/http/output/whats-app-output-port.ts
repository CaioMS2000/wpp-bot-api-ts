import { UserType } from '@/domain/whats-app/@types'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { logger } from '@/core/logger'
import { sendTextMessage } from '../whatsapp-client/sendTextMessage'
import { sendButtonMessage } from '../whatsapp-client/sendButtonMessage'
import { sendListMessage } from '../whatsapp-client/sendListMessage'
import {
    sendDocumentMessage,
    uploadDocument,
} from '../whatsapp-client/sendDocumentMessage'

export class WhatsAppOutputPort implements OutputPort {
    async handle(toUser: UserType, output: OutputMessage) {
        let fn: Nullable<Promise<any>> = null
        switch (output.type) {
            case 'text':
                fn = sendTextMessage(toUser.phone, output.content)
                break
            case 'button':
                fn = sendButtonMessage(
                    toUser.phone,
                    output.text,
                    output.buttons
                )
                break
            case 'list':
                fn = sendListMessage(
                    toUser.phone,
                    output.text,
                    output.buttonText,
                    output.sections
                )
                break
            case 'document':
                const mediaId = await uploadDocument(output.fileUrl)
                fn = sendDocumentMessage(toUser.phone, {
                    mediaId,
                    filename: output.filename,
                })
                break
        }

        if (!fn) {
            logger.warn({ output }, 'Tipo de mensagem não suportado')
        } else {
            try {
                await fn
                logger.info({ toUser, output }, 'Mensagem enviada')
            } catch (err: any) {
                logger.error({ err }, 'Erro ao enviar mensagem')
            }
        }
    }
}
