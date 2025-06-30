import { sendWhatsAppMessageBody } from './client'

type Button = { id: string; title: string }

export async function sendButtonMessage(
    to: string,
    text: string,
    buttons: Button[]
) {
    return sendWhatsAppMessageBody({
        to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text },
            action: {
                buttons: buttons.map(b => ({
                    type: 'reply',
                    reply: { id: b.id, title: b.title },
                })),
            },
        },
    })
}
