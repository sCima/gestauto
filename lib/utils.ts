import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Função para mesclar classes do Tailwind
export function cn(...inputs: any[]) {
    return twMerge(clsx(inputs))
}

// Função para formatar moeda BRL
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value)
}

// Cores de status para veículos
export const getStatusColor = (status: "preparacao" | "pronto" | "vendido" | "finalizado") => {
    switch (status) {
        case "pronto":        // Disponível
            return "bg-green-600 text-white"

        case "preparacao":    // Em preparação
            return "bg-yellow-500 text-black"

        case "vendido":       // Vendido
            return "bg-blue-600 text-white"

        case "finalizado":    // Finalizado
            return "bg-neutral-900 text-white"

        default:
            return "bg-neutral-400 text-black"
    }
}

export const getStatusLabel = (status: "preparacao" | "pronto" | "vendido" | "finalizado") => {
    switch (status) {
        case "preparacao": return "Em preparação"
        case "pronto": return "Disponível"
        case "vendido": return "Vendido"
        case "finalizado": return "Finalizado"
        default: return status
    }
}

import { Transaction } from "@/types/transaction"

// Chaves de armazenamento
export const TX_KEY = "gestauto_faturamento_transactions"

export const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function nextMonthISO(dateISO: string) {
    const d = new Date(dateISO)
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().split("T")[0]
}

// Carrega do localStorage com fallback
export function loadTransactions(): Transaction[] {
    if (typeof window === "undefined") return []
    try {
        const raw = localStorage.getItem(TX_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

// Persiste no localStorage
export function saveTransactions(list: Transaction[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(TX_KEY, JSON.stringify(list))
}

// KPIs
export function calcTotals(transactions: Transaction[]) {
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()

    let totalEntradas = 0
    let totalSaidas = 0
    let mensalEntradas = 0
    let mensalSaidas = 0

    for (const t of transactions) {
        const isCarPurchase =
            t.categoria?.toLowerCase() === "compra_veiculo" ||
            t.descricao?.toLowerCase().includes("compra") // fallback

        // ✔ Entrada normal (inclui lucro de venda)
        if (t.tipo === "entrada") {
            totalEntradas += t.valor
        }

        // ✔ Saída SOMENTE se não for compra de veículo
        if (t.tipo === "saida" && !isCarPurchase) {
            totalSaidas += t.valor
        }

        const td = new Date(t.data)
        const isSameMonth = td.getMonth() === m && td.getFullYear() === y

        if (isSameMonth) {
            if (t.tipo === "entrada") {
                mensalEntradas += t.valor
            } else if (t.tipo === "saida" && !isCarPurchase) {
                mensalSaidas += t.valor
            }
        }
    }

    const saldo = totalEntradas - totalSaidas
    const lucroMensal = mensalEntradas - mensalSaidas

    return {
        totalEntradas,
        totalSaidas,
        saldo,
        mensalEntradas,
        mensalSaidas,
        lucroMensal
    }
}


// Série mensal (últimos 6 meses): {mesLabel, entradas, saidas, lucro}
export function buildMonthlySeries(transactions: Transaction[]) {
    const base = new Date()
    base.setDate(1)

    const buckets = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(base)
        d.setMonth(base.getMonth() - (5 - i))
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        return {
            key,
            label: d.toLocaleDateString("pt-BR", { month: "short" }),
            entradas: 0,
            saidas: 0,
        }
    })

    const idxByKey = new Map(buckets.map((b, i) => [b.key, i]))

    for (const t of transactions) {
        const d = new Date(t.data)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const idx = idxByKey.get(key)
        if (idx == null) continue

        const isCarPurchase =
            t.categoria?.toLowerCase() === "compra_veiculo" ||
            t.descricao?.toLowerCase().includes("compra")

        if (t.tipo === "entrada") {
            buckets[idx].entradas += t.valor
        } else if (!isCarPurchase) {
            buckets[idx].saidas += t.valor
        }
    }


    return buckets.map(b => ({
        mes: b.label.toUpperCase(),
        entradas: b.entradas,
        saidas: b.saidas,
        lucro: b.entradas - b.saidas,
    }))
}

// Pizza: por categoria (apenas entradas)
export function buildCategoryPie(transactions: Transaction[]) {
    const map = new Map<string, number>()

    const getCategoryKey = (t: Transaction): string => {
        if (t.tipo !== "entrada") return "" // ignorado depois

        // Caso especial: lucro de venda de veículo
        if (t.categoria?.toLowerCase() === "lucro venda veículo") {
            if (t.descricao) {
                // tira o "Lucro venda" do começo, se tiver, e usa o resto
                const cleaned = t.descricao.replace(/^lucro venda\s+/i, "").trim()
                return cleaned || "Lucro venda veículo"
            }
            return "Lucro venda veículo"
        }

        // Demais receitas: agrupadas pela categoria normal
        return t.categoria || "Outros"
    }

    for (const t of transactions) {
        if (t.tipo !== "entrada") continue

        const key = getCategoryKey(t)
        if (!key) continue

        map.set(key, (map.get(key) || 0) + t.valor)
    }

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
}



