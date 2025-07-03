# 🧠 Guia de Arquitetura com DDD (Domain-Driven Design) - WhatsApp Support System

Este documento é um guia completo sobre como estruturar, entender e organizar um sistema baseado em DDD (Domain-Driven Design), focado em uma aplicação de **atendimento automatizado via WhatsApp**. Ele reúne os conceitos, conclusões e decisões discutidas em uma sessão de mentoria técnica e pode servir como base para qualquer colaborador entender o projeto e suas decisões arquiteturais.

---

## 🟩 Visão Geral do Domínio

### ✅ Domínio Principal: **Customer Support via WhatsApp**

A responsabilidade principal do sistema é permitir que clientes conversem com um atendente virtual via WhatsApp. O sistema gerencia:

* Clientes
* Conversas
* Mensagens
* Departamentos
* FAQs
* Estados e transições conversacionais

Tudo isso compõe **um único domínio de negócio** coeso. Ainda que existam diferentes aspectos técnicos (admin, métricas, etc.), o **propósito de negócio é único**: **oferecer suporte ao cliente via WhatsApp**.

---

## 🧩 Subdomínios Técnicos (não são bounded contexts separados ainda)

| Nome do Subdomínio  | Tipo       | Função no sistema                                            |
| ------------------- | ---------- | ------------------------------------------------------------ |
| `conversation`      | Core       | Fluxo principal de atendimento, com estados e transições.    |
| `department`        | Supporting | Organização interna dos atendimentos e filas de atendimento. |
| `faq` / `knowledge` | Supporting | Respostas automáticas baseadas em perguntas frequentes.      |
| `analytics`         | Generic    | Consultas e cálculos para relatórios, gráficos e dashboards. |
| `admin`             | Generic    | CRUD de entidades do sistema feitas por operadores humanos.  |

> 🔸 Todos fazem parte do mesmo **domínio de negócio** e compartilham entidades como `Client`, `Department`, `FAQ`, etc.

---

## 🤝 Compartilhamento de Entidades entre Subdomínios Técnicos

### ✅ Sim, você pode importar entidades entre subpastas/subdomínios técnicos

Exemplo: `Department` pode importar `Client`, já que clientes fazem parte da fila de atendimento.

> ⚠️ Isso **não é violação de DDD**, pois estamos dentro de um **único domínio coeso**. Evitar esse tipo de acoplamento aqui seria overengineering.

### 🔒 Quando evitar?

* Quando você quiser isolar subdomínios como módulos independentes (ex: microserviços no futuro)
* Quando quiser aplicar separação formal via *bounded contexts*

### 🫠 Alternativas intermediárias:

* Criar interfaces como `ClientRef` ou `ClientSummary`
* Utilizar apenas `clientId` dentro da fila, e buscar o `Client` via repositório se necessário

---
## 🛠️ Tipos de Serviço na Arquitetura

Nem todo "serviço" significa a mesma coisa. Existem diferenças conceituais importantes entre **Application Services**, **Domain Services** e **Serviços auxiliares (como FAQService)**. Entender essas distinções ajuda a posicionar corretamente a responsabilidade de cada parte.

### 1. Application Service

* **Camada:** Application
* **Responsabilidade:** Orquestrar use cases e coordenar serviços externos.
* **Exemplo:** `WhatsAppMessageService`, que orquestra o recebimento de mensagens e decide qual estado executar.

> Application Services podem chamar vários Use Cases, combinar resultados e interagir com a infraestrutura.

### 2. Use Case

* **Camada:** Application
* **Responsabilidade:** Executar uma intenção específica de um ator. Uma ação do ponto de vista do usuário/sistema.
* **Exemplo:** `ListFAQCategoriesUseCase`, `InsertClientIntoDepartmentQueue`

> Use Cases não devem coordenar outros Use Cases, e são sempre coesos, focados e testáveis.

### 3. Domain Service

* **Camada:** Domain
* **Responsabilidade:** Lógica de negócio que não pertence a uma única entidade.
* **Exemplo:** `QueueAssignmentPolicy`, `MessageRoutingService`

> São puros, sem dependências externas. Ideal para regras que envolvem várias entidades simultaneamente.

### 4. Serviço de Apoio / Auxiliar (como `FAQService`)

* **Camada:** Application (ou à parte da aplicação)
* **Responsabilidade:** Fornecer dados pré-processados, coordenação de repositórios, acesso externo simplificado.
* **Exemplo:** `FAQService.getItems(companyId, categoryName)`

> Quando um estado precisa de dados mas não faz sentido envolver um use case completo, esse tipo de serviço pode encapsular a lógica de busca/filtragem e ser mais leve.

> ⚠️ Importante: esses serviços não são parte do domínio. São auxiliares à camada de aplicação.

### Quando usar cada um?

| Situação                                           | Tipo de Serviço Recomendado |
| -------------------------------------------------- | --------------------------- |
| Preciso coordenar vários Use Cases ou repositórios | Application Service         |
| Uma ação de negócio clara e testável               | Use Case                    |
| Regras entre várias entidades do domínio           | Domain Service              |
| Lógica de busca ou consulta simples para um estado | Serviço Auxiliar            |

> Em caso de dúvida: comece com um Use Case. Se perceber que ele é muito simples, específico e usado apenas em um único estado, considere rebaixar para um serviço auxiliar.
---

## 🛍️ Interpretação de Mensagens e Múltiplos Canais

O sistema é projetado para ser **agnóstico ao canal**. Toda interpretação de mensagens (WhatsApp, Telegram, Webchat) é feita por parsers específicos na camada de **infraestrutura**, que traduzem o payload externo em um formato comum:

```ts
interface ParsedMessage {
  from: string;
  to: string;
  content: string;
  name?: string;
  channel: 'whatsapp' | 'telegram' | 'webchat';
}
```

Esses dados são então repassados para o `WhatsAppMessageService`, que lida com o fluxo conversacional de forma unificada.

---

## 🧭 Quando faz sentido **separar** em subdomínios reais ou bounded contexts?

| Situação                                                 | Separar? |
| -------------------------------------------------------- | -------- |
| Equipes diferentes atuam em partes diferentes do sistema | ✅ Sim    |
| Ciclos de deploy separados são necessários               | ✅ Sim    |
| Métricas ou relatórios crescem em complexidade           | ✅ Sim    |
| Mudanças em `FAQ` quebram o código de `Conversation`     | ✅ Sim    |
| Testes estão lentos ou difíceis por acoplamento          | ✅ Sim    |
| Projeto pequeno, uma equipe só                           | ❌ Não    |
| Entidades naturalmente são compartilhadas                | ❌ Não    |

> 💡 Conclusão: **Não antecipe a separação.** Use organização modular por agora, e só crie contexts separados quando houver motivos reais.

---

# 🧱 Camadas do Sistema (DDD)

```
 Apresentação (HTTP / Controllers)
           ↓
   Application Layer (Use Cases / App Services)
           ↓
   Domínio (Entities, Value Objects, Domain Services, States)
           ↓
   Repositórios (Interfaces)
           ↓
 Infraestrutura (Fastify, InMemoryRepo, Prisma...)
```

---

## 📦 Camadas e Responsabilidades

| Camada                   | Responsabilidade                                                        | Exemplos                                             |
| ------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| **Controller**           | Receber requisições, validar entrada, chamar application services       | Fastify route, `receiveMessage()`                    |
| **Application Service**  | Orquestrar use cases, coordenar transações, lidar com serviços externos | `WhatsAppMessageService`, `ConversationFlowService`  |
| **Use Case**             | Representa uma intenção específica de um ator (história de usuário)     | `CreateDepartmentUseCase`, `AddClientToQueueUseCase` |
| **Domain Service**       | Lógica de domínio que não pertence a uma entidade específica            | `MessageRoutingService`, `QueuePriorityService`      |
| **Entity**               | Modelo de negócio com identidade e comportamento                        | `Client`, `Conversation`, `Department`               |
| **Aggregate Root**       | Entidade que controla consistência de um conjunto de objetos            | `Conversation` (controla `Message`s)                 |
| **Value Object**         | Representar valor imutável com lógica de validação/composição           | `Slug`, `PhoneNumber`, `MessageContent`              |
| **State**                | Modelar variações de comportamento do domínio por estado                | `InitialMenuState`, `FAQCategoriesState`             |
| **Domain Event**         | Comunicar mudanças importantes entre agregados                          | `ConversationStarted`, `MessageSent`                 |
| **Repository Interface** | Definir como acessar/persistir entidades (contrato)                     | `ClientRepository`, `FAQRepository`                  |
| **Factory**              | Criar objetos complexos ou agregados                                    | `ConversationFactory`, `ClientFactory`               |
| **Specification**        | Expressar regras de negócio complexas para queries/validações           | `ActiveClientSpecification`                          |
| **Infraestrutura**       | Implementar repositórios, serviços externos, rotas HTTP                 | `InMemoryClientRepository`, `server.ts`              |

> ⚠️ Use Cases não devem chamar outros Use Cases. Caso precise orquestrar múltiplas operações, isso deve ser feito em um Application Service.

---

## 📚 Hierarquia de Importações (Tabela de Permissões)

| Pode importar \ É importado por     | Entidades | Use Cases | App Services | Handlers | Controllers | Parsers | Repositórios (interfaces) | Infra (ORM/libs) |
|------------------------------|-----------|------------|---------------|----------|-------------|---------|--------------------------|------------------|
| **Entidades**                | ✅        | ❌         | ❌            | ❌       | ❌          | ❌      | ❌                       | ❌               |
| **Use Cases**                | ✅        | ✅         | ❌            | ❌       | ❌          | ❌      | ✅                       | ❌               |
| **App Services**             | ✅        | ✅         | ✅            | ❌       | ❌          | ❌      | ✅                       | ❌               |
| **Handlers**                 | ✅        | ✅         | ✅            | ✅       | ❌          | ❌      | ❌                       | ❌               |
| **Controllers**              | ❌        | ❌         | ✅            | ✅       | ✅          | ✅      | ❌                       | ❌               |
| **Parsers**                  | ❌        | ❌         | ❌            | ❌       | ✅          | ✅      | ❌                       | ❌               |
| **Repositórios (interfaces)** | ✅        | ❌         | ❌            | ❌       | ❌          | ❌      | ✅                       | ❌               |
| **Infra (ORM/libs)**         | ❌        | ❌         | ❌            | ❌       | ❌          | ❌      | ✅                       | ✅               |

> ✅ = pode importar — ❌ = não pode importar

---

---

## 🔄 Fluxo de Dados e Responsabilidades

```
HTTP Request → Controller → Application Service → Use Case → Domain Service/Entity → Repository Interface → Infrastructure Repository
                     ↓              ↓              ↓                    ↓                        ↓                      ↓
              Validação de     Orquestração   Regra de        Comportamento        Contrato de           Implementação
              entrada/saída    e transação    negócio         do domínio           persistência          específica
```

### Responsabilidades de Validação por Camada:

| Camada | Valida o quê? |
|--------|---------------|
| **Controller** | Formato da requisição, tipos de dados, autenticação |
| **Application Service** | Autorização, regras de fluxo, coordenação |
| **Use Case** | Precondições de negócio específicas |
| **Domain Service/Entity** | Invariantes de domínio, regras de negócio |
| **Repository** | Restrições de persistência |

---

## 🔀 State Pattern vs Domain States

### State Pattern (Comportamental)
```typescript
// Estados que definem COMO algo se comporta
interface ConversationState {
  handleMessage(message: Message): StateTransition;
  getAvailableActions(): Action[];
}

class InitialMenuState implements ConversationState {
  handleMessage(message: Message): StateTransition {
    // Lógica específica deste estado
  }
}
```

### Domain States (Status/Enums)
```typescript
// Estados que definem EM QUE SITUAÇÃO algo está
enum ConversationStatus {
  ACTIVE = 'active',
  WAITING_HUMAN = 'waiting_human',
  CLOSED = 'closed'
}

class Conversation {
  private status: ConversationStatus;
  
  close(): void {
    if (this.status === ConversationStatus.ACTIVE) {
      this.status = ConversationStatus.CLOSED;
    }
  }
}
```

### 🔗 Como eles trabalham juntos:
- **Domain States**: Definem status da entidade
- **State Pattern**: Define comportamento baseado no status
- States do padrão podem consultar status da entidade para decidir transições

---

## ✅ Como identificar se algo é um Use Case

### Checklist prático:

1. **É uma ação com intenção explícita de um ator do sistema?**
2. **Possui entrada e saída previsíveis?**
3. **Representa uma unidade atômica de regra de negócio?**
4. **É algo que um Product Owner pediria para implementar como uma tarefa?**
5. **É independente de tecnologia (sem HTTP, DB, etc.)?**
6. **Pode ser testado isoladamente sem infraestrutura?**

> ✅ Se marcar 4 ou mais como "sim", definitivamente é um `UseCase`.

### Exemplos práticos:

| ✅ É Use Case | ❌ Não é Use Case |
|--------------|------------------|
| `SendMessageToClient` | `WhatsAppMessageService` (orquestração) |
| `CreateDepartment` | `MessageController` (entrada HTTP) |
| `AssignClientToQueue` | `DatabaseRepository` (infraestrutura) |
| `CalculateWaitTime` | `ConversationState` (comportamento) |

---

## 🏗️ Padrões Arquiteturais Complementares

### 1. **Aggregate Root Pattern**
```typescript
class Conversation { // Aggregate Root
  private messages: Message[] = [];
  
  addMessage(content: string): void {
    // Controla consistência do agregado
    const message = new Message(content);
    this.messages.push(message);
    this.publishEvent(new MessageAdded(message));
  }
}
```

### 2. **Domain Events Pattern**
```typescript
class ConversationStarted implements DomainEvent {
  constructor(
    public readonly conversationId: string,
    public readonly clientId: string,
    public readonly occurredAt: Date = new Date()
  ) {}
}
```

### 3. **Factory Pattern**
```typescript
class ConversationFactory {
  static createForClient(client: Client, department: Department): Conversation {
    // Lógica complexa de criação
    return new Conversation(client, department, new InitialMenuState());
  }
}
```

### 4. **Specification Pattern**
```typescript
class ActiveClientSpecification {
  isSatisfiedBy(client: Client): boolean {
    return client.isActive() && client.hasValidPhone();
  }
}
```

---

## ✅ Boas Práticas Reforçadas

* **Domínio é sagrado**: Nunca permita que camadas de domínio conheçam aplicação ou infraestrutura
* **States são comportamentais**: Se não define comportamento diferente, é apenas um enum/status
* **Use Cases são atômicos**: Uma responsabilidade, uma razão para mudar
* **Agregates controlam consistência**: Mudanças sempre passam pela raiz do agregado
* **Eventos comunicam mudanças**: Entre agregados, use Domain Events
* **Não antecipe separações**: Módulos técnicos são suficientes até que haja necessidade real
* **Controllers são finos**: Apenas validação de entrada e chamada de Application Services

---

## ⚠️ Antipadrões Comuns a Evitar

| ❌ Antipadrão | ✅ Correção |
|--------------|-------------|
| States importando Use Cases | States apenas definem comportamento local |
| Controllers chamando Use Cases diretamente | Controllers chamam Application Services |
| Entidades conhecendo repositórios | Use Domain Services para orquestração |
| Use Cases orquestrando outros Use Cases | Use Application Services para orquestração |
| Lógica de negócio em Controllers | Mova para Use Cases ou Domain Services |

---

## 📚 Leitura recomendada

* Domain-Driven Design: Tackling Complexity in the Heart of Software — Eric Evans
* Implementing Domain-Driven Design — Vaughn Vernon
* Clean Architecture — Robert C. Martin
* Enterprise Application Architecture Patterns — Martin Fowler

---

> **Esse documento é vivo.** Atualize conforme novas decisões de arquitetura forem surgindo.