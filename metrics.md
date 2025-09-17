## Visão geral da comunicação

O sistema expõe três pontos de consulta que a interface utiliza para obter os números do painel: métricas gerais de atendimento, métricas semanais e métricas por departamento.
No lado do navegador, essas três chamadas são disparadas para preencher os cartões e gráficos de métricas na página dedicada.

---

## Métricas disponíveis e como calculá-las

### 1. Métricas básicas de atendimento
Conjunto de cinco indicadores que oferecem uma visão rápida do desempenho do atendimento. São calculados a partir das conversas registradas no período em andamento (dia ou mês):

| Métrica | Significado | Cálculo resumido |
|--------|-------------|------------------|
| **Conversas Hoje** | Quantas novas conversas de clientes começaram desde a meia‑noite local | Contar conversas cujo início cai entre o início e o fim do dia atual |
| **Clientes Ativos** | Número de clientes únicos que conversaram no mês em curso | Agrupar conversas do mês por cliente e contar o total distinto |
| **Taxa de Resposta** | Proporção de conversas de cliente que receberam ao menos uma resposta humana | Dividir conversas com primeira resposta humana pelo total de conversas de clientes no mês |
| **Tempo Médio de Resposta** | Tempo médio, em segundos, entre a chegada do cliente e a primeira resposta humana | Calcular a média dos intervalos `primeira resposta – chegada na fila` |
| **Conversas com IA** | Quantidade de conversas de cliente atendidas integralmente por um agente automático | Contar conversas do mês cujo agente responsável seja a IA |

Esses dados ajudam a enxergar volume de atendimento, engajamento de clientes e eficiência da equipe.

---

### 2. Métricas semanais de conversas
Fornece uma linha do tempo dos últimos dias, ideal para identificar tendências de resolução ou acúmulo de filas:

- **Período coberto:** do início da semana corrente (domingo, 00h) até o fim do dia atual.
- **Para cada dia:**  
  - **Total:** conversas iniciadas naquele dia.  
  - **Resolvidas:** finalizadas com sucesso.  
  - **Pendentes:** ainda abertas ou abandonadas sem solução.

A interface apresenta esses números em uma lista diária, facilitando a comparação entre dias e o acompanhamento de pendências.

---

### 3. Conversas por departamento
Mostra como o volume de atendimento está distribuído entre setores ou equipes específicos, ajudando na alocação de recursos:

- **Unidade de medida:** quantidade de conversas que passaram por cada departamento no período analisado.

---

Em resumo, o sistema organiza seus indicadores em três blocos — panorâmica diária/mensal, evolução semanal e distribuição por departamento — oferecendo insumos suficientes para monitorar desempenho e planejar melhorias, independentemente da tecnologia empregada para consumi-los.