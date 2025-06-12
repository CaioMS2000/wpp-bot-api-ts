import fs from 'node:fs'
import path from 'node:path'

// Função para encontrar a raiz do projeto procurando por package.json
function findProjectRoot(currentDir: string): string {
    const rootMarkers = ['package.json', '.git']
    let dir = currentDir

    while (dir !== path.parse(dir).root) {
        for (const marker of rootMarkers) {
            if (fs.existsSync(path.join(dir, marker))) {
                return dir
            }
        }
        dir = path.dirname(dir) // Move para o diretório pai
    }

    // Se não encontrou, retorna o diretório atual como fallback
    return currentDir
}

const projectRoot = findProjectRoot(__dirname)
const outputPath = path.join(projectRoot, 'response.json')

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

        // Escreve na raiz do projeto
        fs.writeFileSync(
            outputPath,
            JSON.stringify(
                { ...(data as Record<string, unknown>), input: message },
                null,
                2
            ),
            'utf-8'
        )

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
