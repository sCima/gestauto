"use client"

import { useEffect, useMemo, useState } from "react"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import Header from "@/components/layout/Header"
import TransactionSummary from "@/components/faturamento/TransactionSummary"
import TransactionForm from "@/components/faturamento/TransactionForm"
import TransactionList from "@/components/faturamento/TransactionList"
import { RevenueVsExpenseChart, ProfitLineChart, CategoryPieChart } from "@/components/faturamento/Charts"
import { Transaction } from "@/types/transaction"
import { buildCategoryPie, buildMonthlySeries, calcTotals, loadTransactions, saveTransactions } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"



// MOCKS para visual imediato (só usados se não houver dados reais)
const mockTransactions: Transaction[] = [
    { id: "m1", tipo: "entrada", valor: 120000, descricao: "Venda Corolla", categoria: "Venda", data: "2025-08-10", recorrente: false },
    { id: "m2", tipo: "saida", valor: 8000, descricao: "Aluguel", categoria: "Aluguel", data: "2025-08-05", recorrente: true, proximaOcorrencia: "2025-09-05" },
    { id: "m3", tipo: "entrada", valor: 95000, descricao: "Venda Civic", categoria: "Venda", data: "2025-09-12", recorrente: false },
    { id: "m4", tipo: "saida", valor: 4500, descricao: "Marketing", categoria: "Marketing", data: "2025-09-15", recorrente: false },
    { id: "m5", tipo: "entrada", valor: 135000, descricao: "Venda Jetta", categoria: "Venda", data: "2025-10-02", recorrente: false },
    { id: "m6", tipo: "saida", valor: 12000, descricao: "Folha", categoria: "Pessoal", data: "2025-10-05", recorrente: true, proximaOcorrencia: "2025-11-05" },
]

export default function BillingPage() {
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [toEdit, setToEdit] = useState<Transaction | null>(null)
    const { toast } = useToast()

    // 🔐 Carregar usuário
    useEffect(() => {
        const user = localStorage.getItem("gestauto_user")
        if (user) setCurrentUser(JSON.parse(user))
    }, [])

    // 🚫 Bloqueio de acesso com toast
    useEffect(() => {
        if (currentUser && !["owner", "dono"].includes(currentUser.profile)) {
            toast.error("Você não possui acesso")
            if (typeof window !== "undefined") {
                window.location.href = "/dashboard"
            }
        }
    }, [currentUser, toast])

    // 🔄 Carregar transações
    useEffect(() => {
        const stored = loadTransactions()
        setTransactions(stored.length > 0 ? stored : mockTransactions)
    }, [])

    // 💾 Persistir alterações reais
    useEffect(() => {
        if (transactions.length && transactions !== mockTransactions) {
            saveTransactions(transactions)
        }
    }, [transactions])


    // Hooks derivados
    const totals = useMemo(() => calcTotals(transactions), [transactions])
    const monthly = useMemo(() => buildMonthlySeries(transactions), [transactions])
    const pieCat = useMemo(() => buildCategoryPie(transactions), [transactions])

    const [tab, setTab] = useState<"resumo" | "movs" | "relatorios" | "recorrentes">("resumo")

    if (!currentUser) return null

    function handleSubmit(tx: Transaction) {
        setTransactions((prev) => {
            const isMock = prev === mockTransactions
            const list = isMock ? [] : prev
            const exists = list.some((t) => t.id === tx.id)
            const next = exists ? list.map((t) => (t.id === tx.id ? tx : t)) : [...list, tx]
            return next
        })
    }

    function handleEdit(t: Transaction) {
        setToEdit(t)
    }

    function handleDelete(id: string) {
        setTransactions((prev) => prev.filter((t) => t.id !== id))
    }

    return (
        <ProtectedRoute>
            <Header
                currentPage="dashboard" // mantém navegação global; ajuste se quiser destacar "faturamento" no Header
                currentUser={currentUser}
                onLogout={() => {
                    localStorage.removeItem("gestauto_user")
                    window.location.href = "/"
                }}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Faturamento</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={tab === "resumo" ? "default" : "ghost"}
                            onClick={() => setTab("resumo")}
                        >
                            Resumo
                        </Button>
                        <Button
                            variant={tab === "movs" ? "default" : "ghost"}
                            onClick={() => setTab("movs")}
                        >
                            Movimentações
                        </Button>
                        <Button
                            variant={tab === "relatorios" ? "default" : "ghost"}
                            onClick={() => setTab("relatorios")}
                        >
                            Relatórios
                        </Button>
                        <Button
                            variant={tab === "recorrentes" ? "default" : "ghost"}
                            onClick={() => setTab("recorrentes")}
                        >
                            Recorrentes
                        </Button>
                    </div>

                    <TransactionForm onSubmit={handleSubmit} toEdit={toEdit} onClearEdit={() => setToEdit(null)} />
                </div>

                {/* ===== RESUMO ===== */}
                {tab === "resumo" && (
                    <>
                        <TransactionSummary
                            totalEntradas={totals.totalEntradas}
                            totalSaidas={totals.totalSaidas}
                            saldo={totals.saldo}
                            mensalEntradas={totals.mensalEntradas}
                            mensalSaidas={totals.mensalSaidas}
                            lucroMensal={totals.lucroMensal}
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            <RevenueVsExpenseChart data={monthly} />
                            <ProfitLineChart data={monthly.map((m) => ({ mes: m.mes, lucro: m.lucro }))} />
                        </div>

                        <div className="grid grid-cols-1 mt-6">
                            <CategoryPieChart data={pieCat} />
                        </div>
                    </>
                )}

                {/* ===== MOVIMENTAÇÕES ===== */}
                {tab === "movs" && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumo Rápido</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Entradas no mês</p>
                                    <p className="text-xl font-semibold text-green-600">
                                        {totals.mensalEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Saídas no mês</p>
                                    <p className="text-xl font-semibold text-red-600">
                                        {totals.mensalSaidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Lucro no mês</p>
                                    <p className={`text-xl font-semibold ${totals.lucroMensal >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                        {totals.lucroMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <TransactionList transactions={transactions} onEdit={handleEdit} onDelete={handleDelete} />
                    </div>
                )}

                {/* ===== RELATÓRIOS ===== */}
                {tab === "relatorios" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RevenueVsExpenseChart data={monthly} />
                        <ProfitLineChart data={monthly.map((m) => ({ mes: m.mes, lucro: m.lucro }))} />
                        <CategoryPieChart data={pieCat} />
                    </div>
                )}

                {/* ===== RECORRENTES ===== */}
                {tab === "recorrentes" && (
                    <div className="grid grid-cols-1 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Próximas Ocorrências (estimadas)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {transactions
                                        .filter((t) => t.recorrente)
                                        .map((t) => (
                                            <li key={t.id} className="flex items-center justify-between p-3 border rounded-md">
                                                <div>
                                                    <p className="font-medium">{t.categoria} — {t.descricao}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Próxima: {t.proximaOcorrencia ? new Date(t.proximaOcorrencia).toLocaleDateString("pt-BR") : "—"}
                                                    </p>
                                                </div>
                                                <span className={t.tipo === "entrada" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                                    {(t.tipo === "entrada" ? "+" : "-")}{t.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                                </span>
                                            </li>
                                        ))}
                                    {transactions.filter((t) => t.recorrente).length === 0 && (
                                        <p className="text-muted-foreground">Nenhuma transação recorrente cadastrada.</p>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </ProtectedRoute>
    )
}
