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

async function clientSendMessage(message: string) {
    await sendMessage(message, '5562993765723')
}

async function employeeSendMessage(message: string) {
    await sendMessage(message, '5562993765721')
}

export async function interactionMock() {
    await clientSendMessage('oi')

    // await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await clientSendMessage('3')

    // await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await clientSendMessage('suporte')

    // await new Promise(resolve => setTimeout(resolve, 1000 * 2))

    await clientSendMessage('Menu principal')

    // await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await clientSendMessage('2')

    // await new Promise(resolve => setTimeout(resolve, 1000 * 2))

    await clientSendMessage('Menu principal')

    // await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await clientSendMessage('Departamento de TI')

    // await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await clientSendMessage('alguma mensagem')

    // await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    console.log('\n\n\n\n\n\n\n')
    console.log('==========')
    await employeeSendMessage('alguma mensagem')

    await employeeSendMessage('3')

    await employeeSendMessage('vendas')

    await employeeSendMessage('Menu principal')

    await employeeSendMessage('4')
}
