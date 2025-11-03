"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBRL } from "@/lib/utils"
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface Props {
    totalEntradas: number
    totalSaidas: number
    saldo: number
    mensalEntradas: number
    mensalSaidas: number
    lucroMensal: number
}

export default function TransactionSummary({
    totalEntradas,
    totalSaidas,
    saldo,
    mensalEntradas,
    mensalSaidas,
    lucroMensal,
}: Props) {
    const Item = ({
        title,
        icon,
        value,
        hint,
        valueClass = "",
    }: {
        title: string
        icon: React.ReactNode
        value: string
        hint?: string
        valueClass?: string
    }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </CardContent>
        </Card>
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Item
                title="Entradas Totais"
                icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                value={formatBRL(totalEntradas)}
                hint={`Mês: ${formatBRL(mensalEntradas)}`}
                valueClass="text-green-600"
            />
            <Item
                title="Saídas Totais"
                icon={<TrendingDown className="h-4 w-4 text-red-600" />}
                value={formatBRL(totalSaidas)}
                hint={`Mês: ${formatBRL(mensalSaidas)}`}
                valueClass="text-red-600"
            />
            <Item
                title="Saldo Atual"
                icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                value={formatBRL(saldo)}
                valueClass={saldo >= 0 ? "text-green-600" : "text-red-600"}
            />
            <Item
                title="Lucro Mensal"
                icon={<DollarSign className="h-4 w-4 text-blue-600" />}
                value={formatBRL(lucroMensal)}
                valueClass={lucroMensal >= 0 ? "text-blue-600" : "text-red-600"}
            />
        </div>
    )
}
