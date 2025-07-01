import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { UserType } from '@/domain/whats-app/@types'
import { sendButtonMessage } from '../whatsapp-client/sendButtonMessage'
import {
    sendDocumentMessage,
    uploadDocument,
} from '../whatsapp-client/sendDocumentMessage'
import { sendListMessage } from '../whatsapp-client/sendListMessage'
import { sendTextMessage } from '../whatsapp-client/sendTextMessage'

export class WhatsAppOutputPort implements OutputPort {
    async handle(toUser: UserType, output: OutputMessage) {
        logger.debug('[handle] Output:\n', output)
        try {
            switch (output.type) {
                case 'text':
                    await sendTextMessage(toUser.phone, output.content)
                    break
                case 'button':
                    await sendButtonMessage(
                        toUser.phone,
                        output.text,
                        output.buttons
                    )
                    break
                case 'list':
                    await sendListMessage(
                        toUser.phone,
                        output.text,
                        output.buttonText,
                        output.sections
                    )
                    break
                case 'document':
                    const mediaId = await uploadDocument(output.fileUrl)
                    await sendDocumentMessage(toUser.phone, {
                        mediaId,
                        filename: output.filename,
                    })
                    break
                default:
                    logger.warn({ output }, 'Tipo de mensagem não suportado')
                    return
            }

            logger.info({ toUser, output }, 'Mensagem enviada')
        } catch (err: any) {
            logger.error({ err }, 'Erro ao enviar mensagem')
        }
    }
}
