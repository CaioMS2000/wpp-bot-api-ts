type Client = { type: 'client' }
type Employee = { type: 'employee' }

async function test() {
    let sender: Client | Employee = { type: 'client' }

    if (true) {
        const clientSender: Client = await Promise.resolve({ type: 'client' })
        sender = clientSender
        // Passe o mouse aqui:
        sender
    }

    if (true) {
        const employeeSender: Employee = await Promise.resolve({
            type: 'employee',
        })
        sender = employeeSender
        // Passe o mouse aqui:
        sender
    }
}

test()
