import fs from 'node:fs'
import path from 'node:path'

// Função para encontrar a raiz do projeto procurando por package.json
export function findProjectRoot(currentDir: string): string {
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

export function emptyJsonFile(filePath: string) {
    fs.writeFileSync(
        filePath,
        JSON.stringify({ requests: [] }, null, 4),
        'utf-8'
    )
}

export function appendToJsonObject(
    filePath: string,
    newData: Record<string, any>
) {
    // Lê o arquivo ou cria estrutura padrão se não existir
    let currentData: any
    try {
        currentData = fs.readFileSync(filePath, 'utf-8')
    } catch (err) {
        currentData = '{"outputs": []}'
    }

    // Parse e garante que outputs existe e é um array
    const jsonObject = JSON.parse(currentData)
    if (!Array.isArray(jsonObject.outputs)) {
        jsonObject.outputs = []
    }

    // Adiciona o novo dado ao array outputs
    jsonObject.outputs.push(newData)

    // Escreve de volta no arquivo
    fs.writeFileSync(filePath, JSON.stringify(jsonObject, null, 2), 'utf-8')
}
