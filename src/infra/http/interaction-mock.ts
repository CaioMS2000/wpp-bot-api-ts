import { logger } from '@/core/logger'

async function sendMessage(message: string, phone: string) {
    try {
        const response = await fetch('http://localhost:3000/message', {
            method: 'POST',
            body: JSON.stringify({
                from: phone,
                to: '556236266103',
                message: message,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()

        // logger.print('\n\nrequest response:\n', data)

        return data
    } catch (error) {
        console.error(error)
    }
}

async function clientSendMessage(message: string, secs = 1) {
    await sendMessage(message, '5562993765723')
}

async function employeeSendMessage(message: string, secs = 1) {
    await sendMessage(message, '556292476996')
}

export async function interactionMock() {
    // await clientSendMessage('oi')

    // await clientSendMessage('3')

    // await clientSendMessage('suporte') // não vai mudar o estado pois não é uma das opções

    // await clientSendMessage('Geração de Energia')

    // await clientSendMessage('Menu principal')

    // await clientSendMessage('2')

    // await clientSendMessage('Menu principal')

    // await clientSendMessage('2') // esse "vai e vem" é só pra testar se ele consegue transitar corretamente

    // await clientSendMessage('Tecnologia da Informação')

    // await clientSendMessage('alguma mensagem')

    console.log('\n\n\n\n\n\n\n')
    console.log('==========')
    // await employeeSendMessage('alguma mensagem')

    // await employeeSendMessage('3')

    // await employeeSendMessage('Mercado Livre de Energia')

    // await employeeSendMessage('Menu principal')

    await employeeSendMessage('4')

    // await employeeSendMessage('5')
}
