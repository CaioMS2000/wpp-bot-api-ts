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

// ===== NOVAS FUNÇÕES GENÉRICAS =====

/**
 * Garante que o diretório existe, criando-o se necessário
 */
export function ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

/**
 * Append genérico para qualquer estrutura JSON
 * @param filePath - Caminho do arquivo
 * @param newData - Dados para adicionar
 * @param arrayKey - Nome da chave do array (padrão: 'data')
 * @param defaultStructure - Estrutura padrão se arquivo não existir
 */
export function appendToJsonArray(
    filePath: string,
    newData: Record<string, any>,
    arrayKey = 'data',
    defaultStructure: Record<string, any> = {}
): void {
    // Garante que o diretório existe
    ensureDirectory(path.dirname(filePath))

    let currentData: any
    try {
        currentData = fs.readFileSync(filePath, 'utf-8')
    } catch (err) {
        // Se arquivo não existe, cria estrutura padrão
        const defaultObj = { [arrayKey]: [], ...defaultStructure }
        currentData = JSON.stringify(defaultObj)
    }

    const jsonObject = JSON.parse(currentData)

    // Garante que a chave existe e é um array
    if (!Array.isArray(jsonObject[arrayKey])) {
        jsonObject[arrayKey] = []
    }

    // Adiciona timestamp se não existir
    if (!newData.timestamp) {
        newData.timestamp = new Date().toISOString()
    }

    jsonObject[arrayKey].push(newData)

    fs.writeFileSync(filePath, JSON.stringify(jsonObject, null, 2), 'utf-8')
}

/**
 * Append simples para arquivos de log (uma linha por entrada)
 * @param filePath - Caminho do arquivo
 * @param data - Dados para logar
 * @param format - 'json' ou 'text'
 */
export function appendToLogFile(
    filePath: string,
    data: any,
    format: 'json' | 'text' = 'json'
): void {
    ensureDirectory(path.dirname(filePath))

    let logEntry: string

    if (format === 'json') {
        const logData = {
            timestamp: new Date().toISOString(),
            ...data,
        }
        logEntry = `${JSON.stringify(logData)}\n`
    } else {
        const timestamp = new Date().toISOString()
        logEntry = `[${timestamp}] ${typeof data === 'string' ? data : JSON.stringify(data)}\n`
    }

    fs.appendFileSync(filePath, logEntry, 'utf-8')
}

/**
 * Cria um arquivo JSON com estrutura inicial personalizada
 */
export function createJsonFile(
    filePath: string,
    initialStructure: Record<string, any> = { data: [] }
): void {
    ensureDirectory(path.dirname(filePath))
    fs.writeFileSync(
        filePath,
        JSON.stringify(initialStructure, null, 2),
        'utf-8'
    )
}

/**
 * Lê um arquivo JSON e retorna o objeto parseado
 */
export function readJsonFile<T = any>(filePath: string): T | null {
    try {
        const data = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(data)
    } catch (err) {
        return null
    }
}

/**
 * Utilitário para criar caminhos de arquivo baseados na raiz do projeto
 */
export function createProjectPath(...segments: string[]): string {
    const projectRoot = findProjectRoot(process.cwd())
    return path.join(projectRoot, ...segments)
}
