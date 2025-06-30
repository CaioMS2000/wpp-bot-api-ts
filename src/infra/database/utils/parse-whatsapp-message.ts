export type ParsedWhatsAppMessage = {
    from: string
    to: string
    message: string
}

export function parseWhatsAppMessage(payload: any): ParsedWhatsAppMessage {
    const entry = payload?.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]
    const metadata = change?.value?.metadata

    if (!message || !metadata) {
        throw new Error('Payload inválido ou não contém mensagem')
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
            throw new Error(`Tipo de mensagem '${message.type}' não suportado`)
    }

    if (!content) {
        throw new Error('Mensagem não possui conteúdo textual')
    }

    return { from, to, message: content }
}
