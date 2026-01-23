"use client"

import { useEffect, useMemo, useState } from "react"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import Header from "@/components/layout/Header"
import TransactionSummary from "@/components/faturamento/TransactionSummary"
import TransactionForm from "@/components/faturamento/TransactionForm"
import TransactionList from "@/components/faturamento/TransactionList"
import {
  RevenueVsExpenseChart,
  ProfitLineChart,
  CategoryPieChart,
} from "@/components/faturamento/Charts"
import { Transaction } from "@/types/transaction"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function BillingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [toEdit, setToEdit] = useState<Transaction | null>(null)
  const [tab, setTab] = useState<
    "resumo" | "movs" | "relatorios" | "recorrentes"
  >("resumo")

  const [monthlySeries, setMonthlySeries] = useState<any[]>([])
  const [categorySeries, setCategorySeries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 🔹 Usuário mockado (DEV)
  useEffect(() => {
    setCurrentUser({
      name: "Usuário Teste",
      email: "owner@gestauto.dev",
      role: "owner",
    })
  }, [])

  // 🔹 Carregar transações
  async function loadTransactions() {
    setLoading(true)
    try {
      const res = await fetch("/api/transactions")
      const data = await res.json()
      setTransactions(data)
    } catch {
      toast.error("Erro ao carregar transações")
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Relatórios
  async function loadReports() {
    try {
      const [monthlyRes, categoryRes] = await Promise.all([
        fetch("/api/reports/monthly"),
        fetch("/api/reports/categories"),
      ])

      setMonthlySeries(await monthlyRes.json())
      setCategorySeries(await categoryRes.json())
    } catch {
      toast.error("Erro ao carregar relatórios")
    }
  }

  useEffect(() => {
    loadTransactions()
    loadReports()
  }, [])

  // 🔹 Totais derivados
  const totals = useMemo(() => {
    let totalEntradas = 0
    let totalSaidas = 0
    let mensalEntradas = 0
    let mensalSaidas = 0

    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()

    for (const t of transactions) {
      if (t.tipo === "entrada") totalEntradas += t.valor
      else totalSaidas += t.valor

      const d = new Date(t.data)
      if (d.getMonth() === m && d.getFullYear() === y) {
        if (t.tipo === "entrada") mensalEntradas += t.valor
        else mensalSaidas += t.valor
      }
    }

    return {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      mensalEntradas,
      mensalSaidas,
      lucroMensal: mensalEntradas - mensalSaidas,
    }
  }, [transactions])

  // 🔹 CRUD
  async function handleSubmit(tx: Transaction) {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      })

      if (!res.ok) throw new Error()

      toast.success("Transação salva")
      setToEdit(null)
      loadTransactions()
      loadReports()
    } catch {
      toast.error("Erro ao salvar transação")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error()

      toast.success("Transação removida")
      loadTransactions()
      loadReports()
    } catch {
      toast.error("Erro ao remover transação")
    }
  }

  function handleEdit(t: Transaction) {
    setToEdit(t)
  }

  if (!currentUser) return null

  return (
    <ProtectedRoute>
      <Header
        currentPage="faturamento"
        currentUser={currentUser}
        onLogout={() => (window.location.href = "/")}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold">Faturamento</h2>

          <div className="flex flex-wrap items-center gap-2">
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
        </div>

        {/* Form */}
        <div className="mb-6">
          <TransactionForm
            onSubmit={handleSubmit}
            toEdit={toEdit}
            onClearEdit={() => setToEdit(null)}
          />
        </div>

        {/* ===== RESUMO ===== */}
        {tab === "resumo" && (
          <>
            <TransactionSummary {...totals} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <RevenueVsExpenseChart data={monthlySeries} />
              <ProfitLineChart
                data={monthlySeries.map((m) => ({
                  mes: m.mes,
                  lucro: m.lucro,
                }))}
              />
            </div>

            <div className="grid grid-cols-1 mt-6">
              <CategoryPieChart data={categorySeries} />
            </div>
          </>
        )}

        {/* ===== MOVIMENTAÇÕES ===== */}
        {tab === "movs" && (
          <TransactionList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* ===== RELATÓRIOS ===== */}
        {tab === "relatorios" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueVsExpenseChart data={monthlySeries} />
            <ProfitLineChart
              data={monthlySeries.map((m) => ({
                mes: m.mes,
                lucro: m.lucro,
              }))}
            />
            <CategoryPieChart data={categorySeries} />
          </div>
        )}

        {/* ===== RECORRENTES ===== */}
        {tab === "recorrentes" && (
          <Card>
            <CardHeader>
              <CardTitle>Próximas Ocorrências</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {transactions
                  .filter((t) => t.recorrente)
                  .map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">
                          {t.categoria} — {t.descricao}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Próxima:{" "}
                          {t.proximaOcorrencia
                            ? new Date(
                                t.proximaOcorrencia
                              ).toLocaleDateString("pt-BR")
                            : "—"}
                        </p>
                      </div>
                      <span
                        className={
                          t.tipo === "entrada"
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {(t.tipo === "entrada" ? "+" : "-") +
                          t.valor.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                      </span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </ProtectedRoute>
  )
}
