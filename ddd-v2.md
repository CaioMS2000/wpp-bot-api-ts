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

### 🧠 Alternativas intermediárias:

* Criar interfaces como `ClientRef` ou `ClientSummary`
* Utilizar apenas `clientId` dentro da fila, e buscar o `Client` via repositório se necessário

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
   Application Layer (Use Cases / Services)
           ↓
   Domínio (Entities, Value Objects, States)
           ↓
   Repositórios (Interfaces)
           ↓
 Infraestrutura (Fastify, InMemoryRepo, Prisma...)
```

---

## 📦 Camadas e Responsabilidades

| Camada             | Responsabilidade                                              | Exemplos                                     |
| ------------------ | ------------------------------------------------------------- | -------------------------------------------- |
| **Controller**     | Receber requisições, validar entrada, chamar casos de uso     | Fastify route, `receiveMessage()`            |
| **Use Case**       | Representar ações concretas do sistema para um ator externo   | `ProcessIncomingMessage`, `CreateDepartment` |
| **Service (App)**  | Orquestrar casos de uso relacionados, fluxo de alto nível     | `WhatsAppMessageService`                     |
| **State**          | Modelar variações de comportamento do domínio por estado      | `InitialMenuState`, `FAQCategoriesState`     |
| **Entity**         | Modelo de negócio com identidade e comportamento              | `Client`, `Conversation`, `Department`       |
| **Value Object**   | Representar valor imutável com lógica de validação/composição | `Slug`, `PhoneNumber`                        |
| **Repository**     | Definir como acessar/persistir entidades                      | `ClientRepository`, `FAQRepository`          |
| **Infraestrutura** | Implementar repositórios, serviços externos, rotas HTTP       | `InMemoryClientRepository`, `server.ts`      |

---

## 🔗 Hierarquia de Importações (Quem Pode Importar Quem)

| De \ Para          | Entidades | Services | States | Repositórios | Infra | Controllers |
| ------------------ | --------- | -------- | ------ | ------------ | ----- | ----------- |
| **Entidades**      | ✅         | ❌        | ❌      | ❌            | ❌     | ❌           |
| **States**         | ✅         | ✅        | ✅      | ❌            | ❌     | ❌           |
| **Services**       | ✅         | ✅        | ✅      | ✅            | ❌     | ❌           |
| **Use Cases**      | ✅         | ✅        | ✅      | ✅            | ❌     | ❌           |
| **Controllers**    | ❌         | ✅        | ❌      | ❌            | ✅     | ✅           |
| **Infraestrutura** | ✅ (evite) | ❌        | ❌      | ✅            | ✅     | ❌           |

> 🧠 **Como aplicar essa hierarquia para futuras mudanças:**
>
> Sempre que surgir uma nova necessidade ou camada:
>
> 1. **Classifique a responsabilidade** — é domínio, aplicação, infraestrutura, ou entrada?
> 2. **Veja onde ela se encaixa nessa hierarquia** — o novo código deve importar apenas camadas abaixo.
> 3. **Nunca inverta o fluxo de dependência.** A camada de domínio nunca pode conhecer a aplicação, e esta nunca deve conhecer a infraestrutura.
> 4. **Em caso de dúvida**, prefira criar um novo componente (classe, handler, engine, etc.) e manter o guia atualizado.

---

## 🔁 Use Case vs Service

| Comparativo          | Use Case                              | Service                                |
| -------------------- | ------------------------------------- | -------------------------------------- |
| Representa           | Uma ação do sistema                   | Um agrupador/orquestrador de ações     |
| Tamanho              | Pequeno e direto                      | Pode conter múltiplos use cases        |
| Reusabilidade        | Pontual                               | Alta — pode ser usado por vários casos |
| Exemplo              | `CreateFAQUseCase`                    | `WhatsAppMessageService`               |
| Quando usar separado | Muitos casos distintos, granularidade | Projeto grande, testes isolados        |

> ✅ No seu projeto atual, é aceitável usar um único `Application Service` com múltiplos métodos (casos de uso).

---

## ✅ Boas Práticas Reforçadas

* Não antecipe separações em microserviços
* Nomear subpastas/subdomínios técnicos ajuda a modularizar sem complexidade desnecessária
* Evite acoplamento excessivo, mas **não fuja de acoplamento natural** dentro do mesmo domínio
* Controllers não acessam entidades ou lógica de domínio diretamente — só services ou use cases

---

## 📚 Leitura recomendada

* Domain-Driven Design: Tackling Complexity in the Heart of Software — Eric Evans
* Implementing Domain-Driven Design — Vaughn Vernon
* Clean Architecture — Robert C. Martin

---

> **Esse documento é vivo.** Atualize conforme novas decisões de arquitetura forem surgindo.
