# Backend

## AI Response Token Limit

O serviço de respostas da IA mantém um contador de tokens para cada conversa. Quando o total acumulado ultrapassa **3000 tokens**, o histórico é resumido e armazenado em `conversation.resume`, iniciando um novo contexto para evitar consumo excessivo de tokens.
