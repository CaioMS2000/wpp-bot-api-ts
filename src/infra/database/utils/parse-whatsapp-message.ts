import { logger } from '@/core/logger'

export type ParsedWhatsAppMessage = {
    from: string
    to: string
    message: string
}

export function parseWhatsAppMessage(
    payload: any
): Nullable<ParsedWhatsAppMessage> {
    logger.debug(
        '[webhook] Payload bruto recebido:',
        JSON.stringify(payload, null, 2)
    )

    try {
        const entry = payload?.entry?.[0]
        const change = entry?.changes?.[0]
        const message = change?.value?.messages?.[0]
        const metadata = change?.value?.metadata

        if (!message || !metadata) {
            const tipoEvento = Object.keys(change?.value || {}).filter(
                key => key !== 'metadata'
            )
            logger.info(
                `[webhook] Evento ignorado (sem mensagem de usuário). Tipo(s): ${tipoEvento.join(', ') || 'desconhecido'}`
            )
            return null
        }

        const from = message.from
        const to = metadata.display_phone_number

        let content: string | undefined

        switch (message.type) {
            case 'text':
                content = message.text?.body
                break
            case 'interactive':
                if (message.interactive.type === 'button_reply') {
                    content = message.interactive.button_reply.title
                } else if (message.interactive.type === 'list_reply') {
                    content = message.interactive.list_reply.title
                }
                break
            case 'document':
                content = message.document.filename || message.document.id
                break
            default:
                throw new Error(
                    `Tipo de mensagem '${message.type}' não suportado`
                )
        }

        if (!content) {
            throw new Error('Mensagem não possui conteúdo textual')
        }

        return { from, to, message: content }
    } catch (error) {
        logger.error(
            '[webhook] Erro ao analisar a mensagem do WhatsApp:',
            error
        )
        throw error
    }
}
