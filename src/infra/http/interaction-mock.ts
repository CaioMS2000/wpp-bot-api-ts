async function sendMessage(message: string) {
    try {
        const response = await fetch('http://localhost:3000/message', {
            method: 'POST',
            body: JSON.stringify({
                clientPhone: '5562993765723',
                messageContent: message,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()

        console.log('\n\nrequest response:')
        console.log(data)

        return data
    } catch (error) {
        console.error(error)
    }
}

export async function interactionMock() {
    await sendMessage('oi')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('3')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('suporte')

    await new Promise(resolve => setTimeout(resolve, 1000 * 2))

    await sendMessage('Menu principal')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('2')

    await new Promise(resolve => setTimeout(resolve, 1000 * 2))

    await sendMessage('Menu principal')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('Departamento de TI')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('alguma mensagem')
}
