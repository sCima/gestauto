"use client"

import { useEffect, useMemo, useState } from "react"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import Header from "@/components/layout/Header"
import { Vehicle, initialVehicles } from "@/data/vehicles"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, DollarSign, ShoppingCart, Calendar } from "lucide-react"
import FipeSearch from "@/components/fipe/FipeSearch"
import ChatGestAuto from "@/components/assistente/ChatGestAuto"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Recharts
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
    LabelList,
} from "recharts"

type UserProfile = "owner" | "dono" | "vendedor"

const COLORS = {
    green: "#4CAF50",
    greenLight: "#A5D6A7",
    blue: "#1E88E5",
    amber: "#FBC02D",
    gray: "#9E9E9E",
    grid: "#E5E7EB",
}

const STALE_DAYS_THRESHOLD = 60

function diffInDays(from: string) {
    const d = new Date(from)
    if (Number.isNaN(d.getTime())) return null
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

// Gera lista de meses dos últimos 12 meses
function getLast12Months() {
    const months = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        })
    }
    return months
}

export default function DashboardPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<"dashboard" | "fipe">("dashboard")

    // Filtro de período (padrão: mês atual)
    const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })

    const months = getLast12Months()

    useEffect(() => {
        const user = localStorage.getItem("gestauto_user")
        if (user) setCurrentUser(JSON.parse(user))
    }, [])

    useEffect(() => {
        const saved = localStorage.getItem("gestauto_vehicles")
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setVehicles(Array.isArray(parsed) && parsed.length > 0 ? parsed : initialVehicles)
            } catch {
                setVehicles(initialVehicles)
            }
        } else {
            setVehicles(initialVehicles)
        }
    }, [])

    const profile: UserProfile = currentUser?.profile

    // Filtra veículos por vendedor se necessário
    const scopedVehicles = useMemo(() => {
        if (!currentUser) return []
        if (profile === "vendedor" && vehicles.some((v: any) => "responsavelEmail" in v)) {
            return vehicles.filter((v: any) => v.responsavelEmail === currentUser.email)
        }
        return vehicles
    }, [vehicles, profile, currentUser])

    // Filtra veículos por período selecionado
    const periodVehicles = useMemo(() => {
        const [year, month] = selectedPeriod.split('-').map(Number)
        return scopedVehicles.filter(v => {
            if (v.status === "vendido" && v.saleDate && typeof v.saleDate === 'string') {
                const saleDate = new Date(v.saleDate)
                return saleDate.getFullYear() === year && saleDate.getMonth() + 1 === month
            }
            return false
        })
    }, [scopedVehicles, selectedPeriod])

    if (!currentUser) {
        return <p className="text-center text-gray-500">Carregando...</p>
    }

    // KPIs gerais (estoque total)
    const inStock = scopedVehicles.filter(v => v.status !== "vendido")
    const allSold = scopedVehicles.filter(v => v.status === "vendido")

    // KPIs do período
    const soldInPeriod = periodVehicles
    const totalSalesValue = soldInPeriod.reduce((s, v) => s + (Number(v.salePrice) || 0), 0)
    const totalCostInPeriod = soldInPeriod.reduce((s, v) => {
        const baseCost = Number(v.purchasePrice) || 0
        const extraCosts = (v.expenses || []).reduce((sum, exp: any) => sum + Number(exp.valor), 0)
        return s + baseCost + extraCosts
    }, 0)
    const profitInPeriod = totalSalesValue - totalCostInPeriod

    const totalInventoryValue = inStock.reduce((s, v) => {
        const baseCost = Number(v.purchasePrice) || 0
        const extraCosts = (v.expenses || []).reduce((sum, exp: any) => sum + Number(exp.valor), 0)
        return s + baseCost + extraCosts
    }, 0)

    const expectedProfit = inStock.reduce((s, v) => {
        const expectedSale = Number(v.expectedSalePrice) || 0
        const totalCost = Number(v.purchasePrice) + (v.expenses || []).reduce((sum, exp: any) => sum + Number(exp.valor), 0)
        return s + (expectedSale - totalCost)
    }, 0)

    // Status distribution
    const statusDistribution = [
        { name: "Em preparação", key: "preparacao", value: scopedVehicles.filter(v => v.status === "preparacao").length, color: COLORS.amber },
        { name: "Disponível", key: "pronto", value: scopedVehicles.filter(v => v.status === "pronto").length, color: COLORS.blue },
        { name: "Vendido", key: "vendido", value: scopedVehicles.filter(v => v.status === "vendido").length, color: COLORS.green },
    ].filter(d => d.value > 0)

    // Top 5 por lucro (vendidos no período)
    const profitPerVehicle = soldInPeriod.map(v => {
        const salePrice = Number(v.salePrice) || 0
        const purchasePrice = Number(v.purchasePrice) || 0
        const extraCosts = (v.expenses || []).reduce((sum, exp: any) => sum + Number(exp.valor), 0)
        const profit = salePrice - purchasePrice - extraCosts

        return {
            id: v.id,
            name: `${v.brand} ${v.model}`,
            name2Lines: `${v.brand} ${v.model}\n${v.year}`,
            profit,
        }
    })

    const top5 = profitPerVehicle
        .filter(p => p.profit > 0)
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5)

    // Veículos parados
    const staleVehicles = inStock
        .filter(v => v.entryDate)
        .map(v => {
            const days = diffInDays(v.entryDate as string)
            return { ...v, daysStopped: days }
        })
        .filter(v => v.daysStopped !== null && (v.daysStopped as number) >= STALE_DAYS_THRESHOLD)

    const staleInventoryValue = staleVehicles.reduce((s, v) => {
        const baseCost = Number(v.purchasePrice) || 0
        const extraCosts = (v.expenses || []).reduce((sum, exp: any) => sum + Number(exp.valor), 0)
        return s + baseCost + extraCosts
    }, 0)

    // Gráficos
    const renderDonut = (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                >
                    {statusDistribution.map((entry, i) => (
                        <Cell key={`slice-${i}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: any, _name: string, entry: any) => [`${value} veículo(s)`, entry?.payload?.name]} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )

    const renderTop5Bar = (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top5} margin={{ top: 20, right: 8, bottom: 0, left: 40 }}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />
                <Tooltip
                    formatter={(v: any) => formatCurrency(Number(v))}
                    labelFormatter={(label: string) => label}
                />
                <Bar dataKey="profit" fill={COLORS.green} radius={[6, 6, 0, 0]}>
                    <LabelList
                        dataKey="profit"
                        position="top"
                        formatter={(v: any) => formatCurrency(Number(v))}
                        className="fill-[#111827] text-[12px]"
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )

    // UI Components
    const PeriodSelector = () => (
        <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                            {m.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )

    const OwnerDashboard = () => (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Métricas do Período</h3>
                <PeriodSelector />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
                        <p className="text-xs text-muted-foreground">{inStock.length} veículo(s)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Esperado</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(expectedProfit)}</div>
                        <p className="text-xs text-muted-foreground">
                            Margem {totalInventoryValue > 0 ? ((expectedProfit / totalInventoryValue) * 100).toFixed(1) : 0}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendas no Período</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{soldInPeriod.length}</div>
                        <p className="text-xs text-muted-foreground">veículo(s) vendidos</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro no Período</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(profitInPeriod)}</div>
                        <p className="text-xs text-muted-foreground">
                            Faturamento: {formatCurrency(totalSalesValue)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="h-[360px]">
                    <CardHeader><CardTitle>Distribuição por Status</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        {statusDistribution.length ? renderDonut : <p className="text-sm text-muted-foreground">Sem dados</p>}
                    </CardContent>
                </Card>
                <Card className="h-[360px]">
                    <CardHeader><CardTitle>Top 5 Modelos por Lucro (Período)</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        {top5.length ? renderTop5Bar : <p className="text-sm text-muted-foreground">Sem vendas no período</p>}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 mt-6">
                <StaleVehiclesCard />
            </div>
        </>
    )

    const VendedorDashboard = () => {
        const SELL_TARGET = 5
        const mySalesInPeriod = soldInPeriod.length
        const targetPct = Math.min(100, Math.round((mySalesInPeriod / SELL_TARGET) * 100))

        return (
            <>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Meu Desempenho</h3>
                    <PeriodSelector />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
                            <p className="text-xs text-muted-foreground">{inStock.length} veículo(s) sob minha responsabilidade</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Vendas no Período</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{mySalesInPeriod}</div>
                            <p className="text-xs text-muted-foreground">veículo(s) vendidos</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valor Realizado</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalSalesValue)}</div>
                            <p className="text-xs text-muted-foreground">faturamento bruto</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle>Meus Veículos por Status</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            {statusDistribution.length ? renderDonut : <p className="text-sm text-muted-foreground">Sem dados</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Minha Meta de Vendas (Período)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-2 text-sm">
                                <span>Vendas realizadas</span>
                                <span className="font-medium">{mySalesInPeriod}/{SELL_TARGET}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div className="h-3 bg-emerald-500 rounded-full transition-all" style={{ width: `${targetPct}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Progresso: <span className="font-medium">{targetPct}%</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 mt-6">
                    <Card>
                        <CardHeader><CardTitle>Tempo em Estoque</CardTitle></CardHeader>
                        <CardContent>
                            {inStock.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum veículo em estoque.</p>
                            ) : (
                                <div className="space-y-2">
                                    {inStock.map(v => {
                                        const days = v.entryDate ? diffInDays(v.entryDate) : null
                                        return (
                                            <div key={v.id} className="flex items-center justify-between p-3 border rounded-md">
                                                <div>
                                                    <p className="font-medium">{v.brand} {v.model} {v.year}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Entrada: {v.entryDate ? new Date(v.entryDate).toLocaleDateString('pt-BR') : '—'}
                                                    </p>
                                                </div>
                                                <span className={`text-sm font-semibold ${days && days >= STALE_DAYS_THRESHOLD ? 'text-amber-600' : 'text-gray-600'}`}>
                                                    {days !== null ? `${days} dias` : '—'}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    const StaleVehiclesCard = () => (
        <Card>
            <CardHeader>
                <CardTitle>Veículos parados há mais de {STALE_DAYS_THRESHOLD} dias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {staleVehicles.length === 0 ? (
                    <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                        Nenhum veículo parado além de {STALE_DAYS_THRESHOLD} dias. Bom sinal! 🚀
                    </p>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
                            <span className="font-medium">{staleVehicles.length} veículo(s) em alerta</span>
                            <span className="text-xs md:text-sm text-muted-foreground">
                                Capital travado: <span className="font-semibold">{formatCurrency(staleInventoryValue)}</span>
                            </span>
                        </div>
                        <div className="space-y-2">
                            {staleVehicles.slice(0, 5).map((v) => {
                                const totalCost = Number(v.purchasePrice) + (v.expenses || []).reduce((sum, exp: any) => sum + Number((exp as any).valor), 0)
                                return (
                                    <div key={v.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                                        <div className="text-sm">
                                            <p className="font-medium">{v.brand} {v.model} {v.year}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Entrada: {v.entryDate ? new Date(v.entryDate).toLocaleDateString("pt-BR") : "—"} •
                                                Custo total: {formatCurrency(totalCost)}
                                            </p>
                                        </div>
                                        <div className="text-xs md:text-sm font-semibold text-amber-800">
                                            {(v.daysStopped as number)} dias parado
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )

    return (
        <ProtectedRoute>
            <Header
                currentPage="dashboard"
                currentUser={currentUser}
                onLogout={() => {
                    localStorage.removeItem("gestauto_user")
                    window.location.href = "/"
                }}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-2 mb-6">
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "dashboard" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                        onClick={() => setActiveTab("dashboard")}
                    >
                        Visão Geral
                    </button>
                    {/* <button
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "fipe" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                        onClick={() => setActiveTab("fipe")}
                    >
                        FIPE
                    </button> */}
                </div>

                {activeTab === "dashboard" && (
                    <>
                        <h2 className="text-2xl font-bold mb-6">
                            Dashboard {profile === "owner" ? "— Visão Global" : profile === "dono" ? "— Minha Loja" : "— Meu Desempenho"}
                        </h2>

                        {(profile === "owner" || profile === "dono") && <OwnerDashboard />}
                        {profile === "vendedor" && <VendedorDashboard />}
                        <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6 mt-6">
                            <div className="space-y-6"></div>
                            <ChatGestAuto />
                        </div>
                    </>
                )}

                {/* {activeTab === "fipe" && (
                    <>
                            <CardContent><FipeSearch /></CardContent>
                    </>
                )} */}

                
            </main>
        </ProtectedRoute>
    )
}