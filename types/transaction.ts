export type TransactionType = "entrada" | "saida"

export interface Transaction {
    id: string
    tipo: TransactionType
    valor: number
    descricao: string
    data: string // ISO date "YYYY-MM-DD"
    categoria: string
    recorrente: boolean
    proximaOcorrencia?: string // ISO date
}
