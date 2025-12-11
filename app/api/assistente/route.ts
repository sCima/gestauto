import { NextRequest, NextResponse } from "next/server"
import {
    GoogleGenerativeAI,
    SchemaType,
} from "@google/generative-ai"

import { initialVehicles, Vehicle } from "@/data/vehicles"
import { loadTransactions } from "@/lib/utils"
import { Transaction } from "@/types/transaction"


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

// Por enquanto, usamos o array inicial em memória (POC)
let memoryVehicles: Vehicle[] = [...initialVehicles]
let memoryTransactions: Transaction[] = loadTransactions()

function getEstoque(status?: Vehicle["status"]) {
    if (!status) return memoryVehicles
    return memoryVehicles.filter((v) => v.status === status)
}

function getVeiculosParadosPorTempo() {
    const hoje = new Date()
    const veiculosParados = memoryVehicles
        .filter(v => v.status === "preparacao" || v.status === "pronto")
        .map(v => {
            const entrada = new Date(v.entryDate || new Date().toISOString().slice(0, 10))
            const diasParado = Math.floor((hoje.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24))
            return { ...v, diasParado }
        })
        .sort((a, b) => b.diasParado - a.diasParado)

    return veiculosParados
}

function getVeiculosMaisAntigos() {
    const veiculosAtivos = memoryVehicles
        .filter(v => v.status !== "vendido")
        .sort((a, b) => a.year - b.year)

    return veiculosAtivos
}

function getVeiculoMaisCaro() {
    if (memoryVehicles.length === 0) return null
    return memoryVehicles.reduce((max, v) =>
        v.purchasePrice > max.purchasePrice ? v : max
    )
}

function getVeiculoMaisBarato() {
    if (memoryVehicles.length === 0) return null
    const veiculosAtivos = memoryVehicles.filter(v => v.status === "preparacao" || v.status === "pronto")
    if (veiculosAtivos.length === 0) return null
    return veiculosAtivos.reduce((min, v) =>
        v.purchasePrice < min.purchasePrice ? v : min
    )
}

function getEstatisticasEstoque() {
    const total = memoryVehicles.length
    const porStatus = {
        preparacao: memoryVehicles.filter(v => v.status === "preparacao").length,
        pronto: memoryVehicles.filter(v => v.status === "pronto").length,
        vendido: memoryVehicles.filter(v => v.status === "vendido").length,
    }
    const valorTotalEstoque = memoryVehicles
        .reduce((sum, v) => sum + v.purchasePrice, 0)

    const veiculosAtivos = memoryVehicles.filter(v => v.status !== "vendido")
    const ticketMedio = veiculosAtivos.length > 0 ? valorTotalEstoque / veiculosAtivos.length : 0

    return { total, porStatus, valorTotalEstoque, veiculosAtivos: veiculosAtivos.length, ticketMedio }
}

function addVeiculoFromAI(data: {
    brand: string
    model: string
    year: number
    color?: string
    purchasePrice: number
    expectedSalePrice?: number
    status?: Vehicle["status"]
}) {
    const novo: Vehicle = {
        id: `ai-${Date.now()}`,
        brand: data.brand,
        model: data.model,
        year: data.year,
        color: data.color || "",
        purchasePrice: data.purchasePrice,
        expectedSalePrice: data.expectedSalePrice || 0,
        status: data.status ?? "preparacao",
        responsavelEmail: "",
        entryDate: new Date().toISOString().slice(0, 10),
        fipePrice: undefined,
    }

    memoryVehicles = [...memoryVehicles, novo]
    return novo
}

function addTransacao(data: {
    tipo: "entrada" | "saida"
    valor: number
    descricao: string
    data?: string
    recorrente?: boolean
}) {
    const nova: Transaction = {
        id: `tx-${Date.now()}`,
        tipo: data.tipo,
        valor: data.valor,
        descricao: data.descricao,
        data: data.data || new Date().toISOString().slice(0, 10),
        recorrente: data.recorrente || false,
        categoria: ""
    }

    memoryTransactions = [...memoryTransactions, nova]
    return nova
}

function resumoFaturamentoMes(year: number, month: number) {
    const filtered = memoryTransactions.filter((t) => {
        const d = new Date(t.data)
        return d.getFullYear() === year && d.getMonth() + 1 === month
    })

    const entradas = filtered.filter((t) => t.tipo === "entrada")
    const saidas = filtered.filter((t) => t.tipo === "saida")

    const totalEntradas = entradas.reduce((s, t) => s + t.valor, 0)
    const totalSaidas = saidas.reduce((s, t) => s + t.valor, 0)

    const maiorEntrada = entradas.length > 0
        ? entradas.reduce((max, e) => e.valor > max.valor ? e : max)
        : null
    const maiorSaida = saidas.length > 0
        ? saidas.reduce((max, s) => s.valor > max.valor ? s : max)
        : null

    return {
        year,
        month,
        totalEntradas,
        totalSaidas,
        lucro: totalEntradas - totalSaidas,
        maiorEntrada: maiorEntrada ? { valor: maiorEntrada.valor, descricao: maiorEntrada.descricao } : null,
        maiorSaida: maiorSaida ? { valor: maiorSaida.valor, descricao: maiorSaida.descricao } : null,
        qtdEntradas: entradas.length,
        qtdSaidas: saidas.length,
    }
}

function resumoFaturamentoMultiplosMeses(startYear: number, startMonth: number, endYear: number, endMonth: number) {
    const resultados = []
    let currentYear = startYear
    let currentMonth = startMonth

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        resultados.push(resumoFaturamentoMes(currentYear, currentMonth))
        currentMonth++
        if (currentMonth > 12) {
            currentMonth = 1
            currentYear++
        }
    }

    return resultados
}

function getTransacoesRecorrentes() {
    return memoryTransactions.filter(t => t.recorrente)
}

function getFluxoDeCaixa() {
    const hoje = new Date()
    const mesAtual = hoje.getMonth() + 1
    const anoAtual = hoje.getFullYear()

    const resumoMesAtual = resumoFaturamentoMes(anoAtual, mesAtual)
    const transacoesRecorrentes = getTransacoesRecorrentes()

    const recorrentesEntradas = transacoesRecorrentes.filter(t => t.tipo === "entrada").reduce((sum, t) => sum + t.valor, 0)
    const recorrentesSaidas = transacoesRecorrentes.filter(t => t.tipo === "saida").reduce((sum, t) => sum + t.valor, 0)

    return {
        mesAtual: resumoMesAtual,
        recorrentes: {
            entradas: recorrentesEntradas,
            saidas: recorrentesSaidas,
            saldo: recorrentesEntradas - recorrentesSaidas,
        }
    }
}

export async function POST(req: NextRequest) {
    try {
        // Verificar se a API key está configurada
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ GEMINI_API_KEY não encontrada!")
            return NextResponse.json(
                { error: "Configuração da API ausente. Configure GEMINI_API_KEY nas variáveis de ambiente." },
                { status: 500 },
            )
        }

        const body = (await req.json()) as {
            messages: { role: "user" | "assistant"; content: string }[]
        }

        const { messages } = body
        const lastUserMessage = messages[messages.length - 1]?.content ?? ""

        // Data atual para contexto
        const hoje = new Date()
        const dataAtual = `${hoje.getDate()}/${hoje.getMonth() + 1}/${hoje.getFullYear()}`
        const mesAtual = hoje.getMonth() + 1
        const anoAtual = hoje.getFullYear()

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            tools: [
                {
                    functionDeclarations: [
                        {
                            name: "listarEstoque",
                            description: "Lista veículos do estoque. Use quando perguntarem sobre carros, estoque, veículos disponíveis.",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    status: {
                                        type: SchemaType.STRING,
                                        description: "Opcional. Filtrar por status: preparacao, pronto, vendido",
                                    },
                                },
                            },
                        },
                        {
                            name: "getVeiculosParadosPorTempo",
                            description: "Retorna veículos parados ordenados por tempo (mais parados primeiro). Use quando perguntarem sobre carros parados, há quanto tempo estão parados, veículos antigos na loja.",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {},
                            },
                        },
                        {
                            name: "getVeiculosMaisAntigos",
                            description: "Retorna veículos ordenados por ano de fabricação (mais antigos primeiro). Use quando perguntarem sobre carros mais velhos, ano mais antigo.",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {},
                            },
                        },
                        {
                            name: "getEstatisticasEstoque",
                            description: "Retorna estatísticas completas do estoque: totais, valores, ticket médio. Use para visão geral.",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {},
                            },
                        },
                        {
                            name: "getVeiculoMaisCaro",
                            description: "Retorna o veículo mais caro do estoque",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {},
                            },
                        },
                        {
                            name: "getVeiculoMaisBarato",
                            description: "Retorna o veículo mais barato do estoque ativo",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {},
                            },
                        },
                        {
                            name: "cadastrarVeiculo",
                            description: "Cadastra um novo veículo no estoque. Use quando o usuário disser para adicionar/cadastrar um carro.",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    brand: { type: SchemaType.STRING, description: "Marca do veículo (ex: Toyota, Honda)" },
                                    model: { type: SchemaType.STRING, description: "Modelo do veículo (ex: Corolla, Civic)" },
                                    year: { type: SchemaType.NUMBER, description: "Ano de fabricação" },
                                    color: { type: SchemaType.STRING, description: "Cor do veículo" },
                                    purchasePrice: { type: SchemaType.NUMBER, description: "Preço de compra em reais" },
                                    expectedSalePrice: { type: SchemaType.NUMBER, description: "Preço de venda esperado" },
                                    status: { type: SchemaType.STRING, description: "Status: preparacao, pronto, vendido" },
                                },
                                required: ["brand", "model", "year", "purchasePrice"],
                            },
                        },
                        {
                            name: "cadastrarTransacao",
                            description: "Registra uma entrada ou saída financeira. Use quando falarem sobre pagamentos, recebimentos, despesas, receitas.",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    tipo: {
                                        type: SchemaType.STRING,
                                        description: "Tipo: 'entrada' para receitas ou 'saida' para despesas"
                                    },
                                    valor: { type: SchemaType.NUMBER, description: "Valor em reais" },
                                    descricao: { type: SchemaType.STRING, description: "Descrição da transação" },
                                    data: { type: SchemaType.STRING, description: "Data no formato YYYY-MM-DD. Se não informado, usa data atual." },
                                    recorrente: { type: SchemaType.BOOLEAN, description: "Se é uma transação recorrente mensal" },
                                },
                                required: ["tipo", "valor", "descricao"],
                            },
                        },
                        {
                            name: "relatorioFaturamentoMes",
                            description: "Relatório de faturamento de um mês específico, com entradas, saídas, lucro e destaques.",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    year: { type: SchemaType.NUMBER },
                                    month: { type: SchemaType.NUMBER },
                                },
                                required: ["year", "month"],
                            },
                        },
                        {
                            name: "relatorioFaturamentoMultiplosMeses",
                            description: "Relatório de faturamento para vários meses consecutivos. Use para 'últimos X meses'.",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    startYear: { type: SchemaType.NUMBER },
                                    startMonth: { type: SchemaType.NUMBER },
                                    endYear: { type: SchemaType.NUMBER },
                                    endMonth: { type: SchemaType.NUMBER },
                                },
                                required: ["startYear", "startMonth", "endYear", "endMonth"],
                            },
                        },
                        {
                            name: "getTransacoesRecorrentes",
                            description: "Lista todas as transações marcadas como recorrentes",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {},
                            },
                        },
                        {
                            name: "getFluxoDeCaixa",
                            description: "Análise de fluxo de caixa com resumo do mês atual e despesas/receitas recorrentes",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {},
                            },
                        },
                    ],
                },
            ],
            systemInstruction: {
                role: "system",
                parts: [
                    {
                        text:
                            `Você é Sofia, a assistente inteligente do GestAuto - sistema de gestão para concessionárias e revendas de veículos.

🗓️ DATA ATUAL: ${dataAtual} (dia/mês/ano)
📅 MÊS/ANO ATUAL: ${mesAtual}/${anoAtual}

🎯 SUA MISSÃO:
Ajudar o gestor da loja a tomar decisões inteligentes sobre:
- Gestão de estoque (quais carros comprar/vender, identificar veículos parados)
- Análise financeira (faturamento, lucro, fluxo de caixa)
- Identificação de oportunidades e riscos
- Planejamento estratégico

💡 COMO VOCÊ DEVE AGIR:

1. **SEJA PROATIVA E INTELIGENTE**
   - Infira informações não explícitas (ex: "esse mês" = ${mesAtual}/${anoAtual})
   - "Últimos 6 meses" = calcule automaticamente de ${mesAtual - 5 <= 0 ? 12 + (mesAtual - 5) : mesAtual - 5}/${mesAtual - 5 <= 0 ? anoAtual - 1 : anoAtual} até ${mesAtual}/${anoAtual}
   - "Dezembro" sem ano = ${anoAtual}
   - "Carros parados" = use getVeiculosParadosPorTempo (ordena por dias parados)
   - "Carros mais antigos" = use getVeiculosMaisAntigos (ordena por ano de fabricação)

2. **RESPOSTAS CONTEXTUAIS**
   - Ao listar veículos parados, SEMPRE mencione quantos dias estão parados
   - Sugira ações quando identificar problemas (ex: "Este Civic está parado há 120 dias, considere reduzir o preço")
   - Compare com benchmarks do mercado quando relevante
   - Destaque oportunidades e riscos

3. **FORMATAÇÃO**
   - Use emojis para deixar respostas mais visuais: 🚗💰📊📈📉⚠️✅
   - Valores em R$ com formato brasileiro (ex: R$ 45.000,00)
   - Seja concisa mas completa
   - Use bullet points quando listar múltiplos itens

4. **PERGUNTAS COMUNS E COMO RESPONDER**

"Tenho algum carro [ano]?" ou "E um [ano]?"
→ SEMPRE use listarEstoque SEM filtro de status
→ Analise TODOS os veículos retornados
→ Filtre manualmente pelo ano específico mencionado
→ Se encontrar, liste: marca, modelo, ano, valor, status
→ Se NÃO encontrar, diga claramente: "Não, não há veículos de [ano] no estoque"
→ NUNCA invente dados ou assuma que existe algo

"Quais carros estão parados?"
→ Use getVeiculosParadosPorTempo e mostre: marca, modelo, ano, dias parados, valor
→ SEMPRE calcule e mostre dias parados
→ Alerte se algum estiver parado há mais de 60 dias

"Carros mais antigos"
→ Use getVeiculosMaisAntigos (ordena por ANO do veículo, não por tempo na loja)

"Quanto lucrei esse mês?"
→ Use relatorioFaturamentoMes(${anoAtual}, ${mesAtual})

"Cadastrar novo carro"
→ Use cadastrarVeiculo - pergunte apenas dados faltantes essenciais

"Registrar venda de R$ 50k"
→ Use cadastrarTransacao com tipo="entrada"

"Registrar aluguel de R$ 5k mensal"
→ Use cadastrarTransacao com recorrente=true

"Qual meu maior gasto?"
→ Use relatorioFaturamentoMes e mostre maiorSaida

"Despesas recorrentes"
→ Use getTransacoesRecorrentes

5. **ANÁLISES INTELIGENTES**
Quando mostrar dados financeiros:
- Indique se lucro é positivo/negativo
- Compare com mês anterior quando possível
- Sugira ações se identificar problemas
- Destaque transações recorrentes relevantes

6. **CADASTROS**
Para cadastrar veículos: peça apenas dados essenciais faltantes (marca, modelo, ano, preço de compra)
Para cadastrar transações: infira tipo (entrada/saída), peça valor e descrição

🚫 NUNCA - REGRAS CRÍTICAS:
- NUNCA invente ou assuma dados que não foram retornados pelas funções
- NUNCA diga que existe um veículo sem ANTES chamar a função apropriada
- NUNCA mencione marcas, modelos ou anos específicos sem confirmar com as funções
- Se não encontrar algo nas funções, diga claramente "não encontrei" ao invés de inventar
- Não peça informações que você pode inferir
- Não faça múltiplas perguntas seguidas
- Não ignore o contexto de data atual

✅ SEMPRE - REGRAS OBRIGATÓRIAS:
- Use as funções/ferramentas disponíveis ANTES de responder sobre dados específicos
- Quando perguntarem sobre um ano específico, chame listarEstoque e FILTRE manualmente os resultados
- Baseie 100% da resposta nos dados retornados pelas funções
- Se a função retornar vazio, diga que não encontrou
- Forneça insights apenas sobre dados reais retornados pelas funções
- Seja útil para decisões de negócio
- Mantenha tom profissional mas amigável

⚠️ VALIDAÇÃO DE DADOS:
Antes de confirmar que existe um veículo/transação:
1. SEMPRE chame a função correspondente
2. Analise o resultado retornado
3. Responda APENAS com base no que foi retornado
4. Se não encontrar, seja honesto: "Não encontrei veículos de [ano]"`,
                    },
                ],
            },
        })

        // histórico simples (só texto)
        // Gemini usa "model" ao invés de "assistant"
        const history = messages.slice(0, -1).map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }))

        const chat = model.startChat({ history })

        // API nova: sendMessage recebe string ou parts
        const result = await chat.sendMessage(lastUserMessage)

        // A tipagem do SDK pra tools é chatinha, então vamos usar 'any' aqui
        const r: any = result.response
        const toolParts =
            r?.candidates?.[0]?.content?.parts?.filter(
                (p: any) => p.functionCall,
            ) || []

        if (toolParts.length > 0) {
            const call = toolParts[0].functionCall
            const name: string = call.name
            const args = call.args || {}

            if (name === "listarEstoque") {
                const lista = getEstoque(args.status as any)

                // Adiciona informação sobre total de veículos
                const totalVeiculos = memoryVehicles.length

                const texto = lista.length
                    ? `📋 Encontrei ${lista.length} de ${totalVeiculos} veículos totais:\n` +
                    lista
                        .map(
                            (v) =>
                                `🚗 ${v.brand} ${v.model} ${v.year} - ${v.status} - Compra: R$ ${v.purchasePrice.toLocaleString("pt-BR")}`,
                        )
                        .join("\n") +
                    `\n\n⚠️ IMPORTANTE: Esta é a lista COMPLETA. Não invente outros veículos além destes.`
                    : "❌ Nenhum veículo encontrado com esse filtro. O estoque está vazio ou não há veículos neste status."

                const follow = await chat.sendMessage(
                    `Resultado da função listarEstoque:\n${texto}\n\nIMPORTANTE: Responda APENAS com base nestes dados. Se o usuário perguntar sobre um ano/modelo que NÃO está nesta lista, diga claramente que não existe no estoque.`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "getVeiculosParadosPorTempo") {
                const veiculos = getVeiculosParadosPorTempo()
                const texto = veiculos.length > 0
                    ? `Veículos parados (ordenados por tempo):\n` +
                    veiculos.map(v =>
                        `🚗 ${v.brand} ${v.model} ${v.year} - ⏱️ ${v.diasParado} dias parado - ${v.status} - R$ ${v.purchasePrice.toLocaleString("pt-BR")}`
                    ).join("\n")
                    : "Não há veículos parados no momento."

                const follow = await chat.sendMessage(
                    `Resultado da função getVeiculosParadosPorTempo:\n${texto}`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "getVeiculosMaisAntigos") {
                const veiculos = getVeiculosMaisAntigos()
                const texto = veiculos.length > 0
                    ? `Veículos mais antigos (por ano de fabricação):\n` +
                    veiculos.slice(0, 10).map(v =>
                        `🚗 ${v.brand} ${v.model} ${v.year} - ${v.status} - R$ ${v.purchasePrice.toLocaleString("pt-BR")}`
                    ).join("\n")
                    : "Não há veículos no estoque."

                const follow = await chat.sendMessage(
                    `Resultado da função getVeiculosMaisAntigos:\n${texto}`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "getEstatisticasEstoque") {
                const stats = getEstatisticasEstoque()
                const texto = `📊 Estatísticas do Estoque:

Total de veículos: ${stats.total}
├─ 🔧 Em preparação: ${stats.porStatus.preparacao}
├─ ✅ Prontos: ${stats.porStatus.pronto}
└─ 💰 Vendidos: ${stats.porStatus.vendido}

💵 Valor total investido (estoque ativo): R$ ${stats.valorTotalEstoque.toLocaleString("pt-BR")}
📈 Ticket médio: R$ ${stats.ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`

                const follow = await chat.sendMessage(
                    `Resultado da função getEstatisticasEstoque:\n${texto}`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "getVeiculoMaisCaro") {
                const veiculo = getVeiculoMaisCaro()
                const texto = veiculo
                    ? `🏆 Veículo mais caro: ${veiculo.brand} ${veiculo.model} ${veiculo.year} - R$ ${veiculo.purchasePrice.toLocaleString("pt-BR")} (${veiculo.status})`
                    : "Não há veículos no estoque."

                const follow = await chat.sendMessage(
                    `Resultado da função getVeiculoMaisCaro:\n${texto}`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "getVeiculoMaisBarato") {
                const veiculo = getVeiculoMaisBarato()
                const texto = veiculo
                    ? `💡 Veículo mais barato: ${veiculo.brand} ${veiculo.model} ${veiculo.year} - R$ ${veiculo.purchasePrice.toLocaleString("pt-BR")} (${veiculo.status})`
                    : "Não há veículos ativos no estoque."

                const follow = await chat.sendMessage(
                    `Resultado da função getVeiculoMaisBarato:\n${texto}`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "cadastrarVeiculo") {
                const novo = addVeiculoFromAI({
                    brand: String(args.brand),
                    model: String(args.model),
                    year: Number(args.year),
                    color: args.color ? String(args.color) : undefined,
                    purchasePrice: Number(args.purchasePrice),
                    expectedSalePrice: args.expectedSalePrice ? Number(args.expectedSalePrice) : undefined,
                    status: args.status as any,
                })

                const follow = await chat.sendMessage(
                    `✅ Veículo cadastrado com sucesso!\n🚗 ${novo.brand} ${novo.model} ${novo.year}\n💵 Compra: R$ ${novo.purchasePrice.toLocaleString("pt-BR")}\n📍 Status: ${novo.status}\n`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "cadastrarTransacao") {
                const nova = addTransacao({
                    tipo: args.tipo as "entrada" | "saida",
                    valor: Number(args.valor),
                    descricao: String(args.descricao),
                    data: args.data ? String(args.data) : undefined,
                    recorrente: args.recorrente === true,
                })

                const icone = nova.tipo === "entrada" ? "💰" : "📤"
                const recorrenteTexto = nova.recorrente ? " (RECORRENTE)" : ""
                const follow = await chat.sendMessage(
                    `✅ Transação registrada!\n${icone} ${nova.tipo.toUpperCase()}${recorrenteTexto}\nValor: R$ ${nova.valor.toLocaleString("pt-BR")}\nDescrição: ${nova.descricao}\nData: ${new Date(nova.data).toLocaleDateString("pt-BR")}`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "relatorioFaturamentoMes") {
                const year = Number(args.year)
                const month = Number(args.month)
                const resumo = resumoFaturamentoMes(year, month)

                const texto = `📊 Relatório de Faturamento - ${String(month).padStart(2, "0")}/${year}

📈 ENTRADAS: R$ ${resumo.totalEntradas.toLocaleString("pt-BR")} (${resumo.qtdEntradas} transações)
${resumo.maiorEntrada ? `   🏆 Maior: R$ ${resumo.maiorEntrada.valor.toLocaleString("pt-BR")} - ${resumo.maiorEntrada.descricao}` : ''}

📉 SAÍDAS: R$ ${resumo.totalSaidas.toLocaleString("pt-BR")} (${resumo.qtdSaidas} transações)
${resumo.maiorSaida ? `   ⚠️ Maior: R$ ${resumo.maiorSaida.valor.toLocaleString("pt-BR")} - ${resumo.maiorSaida.descricao}` : ''}

💰 LUCRO: R$ ${resumo.lucro.toLocaleString("pt-BR")} ${resumo.lucro >= 0 ? '✅' : '⚠️'}`

                const follow = await chat.sendMessage(
                    `Resultado da função relatorioFaturamentoMes:\n${texto}`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "relatorioFaturamentoMultiplosMeses") {
                const startYear = Number(args.startYear)
                const startMonth = Number(args.startMonth)
                const endYear = Number(args.endYear)
                const endMonth = Number(args.endMonth)

                const resultados = resumoFaturamentoMultiplosMeses(startYear, startMonth, endYear, endMonth)
                const totalLucro = resultados.reduce((sum, r) => sum + r.lucro, 0)

                const texto = `📊 Relatório ${String(startMonth).padStart(2, "0")}/${startYear} até ${String(endMonth).padStart(2, "0")}/${endYear}\n\n` +
                    resultados.map(r =>
                        `${String(r.month).padStart(2, "0")}/${r.year}: 📈 R$ ${r.totalEntradas.toLocaleString("pt-BR")} | 📉 R$ ${r.totalSaidas.toLocaleString("pt-BR")} | 💰 R$ ${r.lucro.toLocaleString("pt-BR")}`
                    ).join("\n") +
                    `\n\n🎯 TOTAL ACUMULADO: R$ ${totalLucro.toLocaleString("pt-BR")} ${totalLucro >= 0 ? '✅' : '⚠️'}`

                const follow = await chat.sendMessage(
                    `Resultado da função relatorioFaturamentoMultiplosMeses:\n${texto}`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "getTransacoesRecorrentes") {
                const recorrentes = getTransacoesRecorrentes()
                const texto = recorrentes.length > 0
                    ? `💳 Transações Recorrentes:\n` +
                    recorrentes.map(t =>
                        `${t.tipo === "entrada" ? "📈" : "📉"} ${t.descricao}: R$ ${t.valor.toLocaleString("pt-BR")} (${t.tipo})`
                    ).join("\n")
                    : "Não há transações recorrentes cadastradas."

                const follow = await chat.sendMessage(
                    `Resultado da função getTransacoesRecorrentes:\n${texto}`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }

            if (name === "getFluxoDeCaixa") {
                const fluxo = getFluxoDeCaixa()
                const texto = `💼 Análise de Fluxo de Caixa

📅 MÊS ATUAL (${fluxo.mesAtual.month}/${fluxo.mesAtual.year}):
Entradas: R$ ${fluxo.mesAtual.totalEntradas.toLocaleString("pt-BR")}
Saídas: R$ ${fluxo.mesAtual.totalSaidas.toLocaleString("pt-BR")}
Lucro: R$ ${fluxo.mesAtual.lucro.toLocaleString("pt-BR")} ${fluxo.mesAtual.lucro >= 0 ? '✅' : '⚠️'}

🔄 DESPESAS/RECEITAS RECORRENTES (mensais):
📈 Entradas fixas: R$ ${fluxo.recorrentes.entradas.toLocaleString("pt-BR")}
📉 Saídas fixas: R$ ${fluxo.recorrentes.saidas.toLocaleString("pt-BR")}
💰 Saldo recorrente: R$ ${fluxo.recorrentes.saldo.toLocaleString("pt-BR")} ${fluxo.recorrentes.saldo >= 0 ? '✅' : '⚠️'}`

                const follow = await chat.sendMessage(
                    `Resultado da função getFluxoDeCaixa:\n${texto}`,
                )
                return NextResponse.json({ reply: follow.response.text() })
            }
        }

        // Sem tool call → resposta direta
        const text = result.response.text()
        return NextResponse.json({ reply: text })
    } catch (e: any) {
        console.error("❌ Erro na API do assistente:", e)

        // Mensagem de erro mais informativa
        const errorMessage = e?.message || "Erro desconhecido"

        return NextResponse.json(
            {
                error: "Erro ao processar requisição do assistente.",
                details: process.env.NODE_ENV === "development" ? errorMessage : undefined
            },
            { status: 500 },
        )
    }
}