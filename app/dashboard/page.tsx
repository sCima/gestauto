"use client"

import { useEffect, useMemo, useState } from "react"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import Header from "@/components/layout/Header"
import { Vehicle, initialVehicles } from "@/data/vehicles"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, DollarSign, Wallet } from "lucide-react"
import FipeSearch from "@/components/fipe/FipeSearch"

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
    AreaChart,
    Area,
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

const STALE_DAYS_THRESHOLD = 60 // dias parado pra ser considerado "alerta"

function diffInDays(from: string) {
    const d = new Date(from)
    if (Number.isNaN(d.getTime())) return null
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function TwoLineTick(props: any) {
    const { x, y, payload } = props
    const [line1, line2] = String(payload.value).split("\n")
    return (
        <g transform={`translate(${x},${y})`}>
            <text textAnchor="middle" fill="#374151" fontSize={12}>
                <tspan x={0} dy={0}>{line1}</tspan>
                <tspan x={0} dy={14}>{line2}</tspan>
            </text>
        </g>
    )
}

export default function DashboardPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<"dashboard" | "fipe">("dashboard")

    // 🔐 Carrega usuário
    useEffect(() => {
        const user = localStorage.getItem("gestauto_user")
        if (user) setCurrentUser(JSON.parse(user))
    }, [])

    // 🚗 Carrega veículos com fallback
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



    //  PERFIL 

    const profile: UserProfile = currentUser?.profile

    const scopedVehicles = useMemo(() => {
        if (!currentUser) return []
        if (profile === "vendedor" && vehicles.some((v: any) => "responsavelEmail" in v)) {
            return vehicles.filter((v: any) => v.responsavelEmail === currentUser.email)
        }
        return vehicles
    }, [vehicles, profile, currentUser])

    if (!currentUser) {
        return <p className="text-center text-gray-500">Carregando...</p>
    }

    <Card className="mt-6">
        <CardHeader><CardTitle>Tabela FIPE</CardTitle></CardHeader>
        <CardContent>
            <FipeSearch />
        </CardContent>
    </Card>

    // ===== KPIs =====
    const inStock = scopedVehicles.filter(v => v.status !== "vendido")
    const sold = scopedVehicles.filter(v => v.status === "vendido")

    const totalInventoryValue = inStock.reduce((s, v) => s + Number(v.purchasePrice), 0)
    const expectedProfit = inStock.reduce((s, v) => s + (Number(v.expectedSalePrice) - Number(v.purchasePrice)), 0)
    const realizedProfit = sold.reduce((s, v) => s + ((Number(v.salePrice) || 0) - Number(v.purchasePrice)), 0)

    // ===== DATASETS DE GRÁFICOS =====
    // Donut status
    const statusDistribution = [
        { name: "Em preparação", key: "preparacao", value: scopedVehicles.filter(v => v.status === "preparacao").length, color: COLORS.amber },
        { name: "Disponível", key: "pronto", value: scopedVehicles.filter(v => v.status === "pronto").length, color: COLORS.blue },
        { name: "Vendido", key: "vendido", value: scopedVehicles.filter(v => v.status === "vendido").length, color: COLORS.green },
        { name: "Finalizado", key: "finalizado", value: scopedVehicles.filter(v => v.status === "finalizado").length, color: COLORS.gray },
    ].filter(d => d.value > 0)

    // só veículos vendidos (ajusta se tiver "finalizado" também)
    const soldVehicles = scopedVehicles.filter(
        v => v.status === "vendido"
        // || v.status === "finalizado"
    )

    // Top 5 por lucro (apenas vendidos)
    const profitPerVehicle = soldVehicles.map(v => {
        const profit = Number(v.salePrice ?? 0) - Number(v.purchasePrice ?? 0)

        return {
            id: v.id,
            name2Lines: `${v.brand} ${v.model}\n${v.year}`,
            profit,
        }
    })

    const top5 = profitPerVehicle
        .filter(p => p.profit > 0)            // opcional
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5)




    // Meta do vendedor
    const SELL_TARGET = 5
    const mySoldCount = sold.length
    const targetPct = Math.min(100, Math.round((mySoldCount / SELL_TARGET) * 100))

    // Veículos parados há muito tempo (sem vender)
    const staleVehicles = inStock
        .filter(v => v.entryDate) // só quem tem data
        .map(v => {
            const days = diffInDays(v.entryDate as string)
            return { ...v, daysStopped: days }
        })
        .filter(v => v.daysStopped !== null && (v.daysStopped as number) >= STALE_DAYS_THRESHOLD)

    const staleInventoryValue = staleVehicles.reduce(
        (s, v) => s + Number(v.purchasePrice),
        0
    )


    // ===== RENDERIZADORES DE GRÁFICOS =====
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
            <BarChart
                data={top5}
                margin={{ top: 20, right: 8, bottom: 0, left: 40 }}
            >
                <CartesianGrid stroke={COLORS.grid} vertical={false} />

                <XAxis
                    dataKey="name2Lines"
                    interval={0}
                    // só mostra a primeira parte (marca) no rótulo do eixo
                    tickFormatter={(value: string) => value.split(" ")[0]}
                // se quiser pode tirar o TwoLineTick, não precisa mais dele:
                // tick={<TwoLineTick />}
                />

                <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />

                <Tooltip
                    // aqui continua usando o valor numérico normal
                    formatter={(v: any) => formatCurrency(Number(v))}
                    // aqui o label ainda vem COMPLETO, com o \n se tiver
                    labelFormatter={(label: string) => label.replace("\n", " — ")}
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




    // ===== UI BLOCS =====
    const CardsKPIs = () => (
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
                    <CardTitle className="text-sm font-medium">Lucro Realizado</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(realizedProfit)}</div>
                    <p className="text-xs text-muted-foreground">{sold.length} veículo(s) vendidos</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">Online</div>
                    <p className="text-xs text-muted-foreground">Sistema operacional</p>
                </CardContent>
            </Card>
        </div>
    )

    const OwnerDashboard = () => (
        <>
            <CardsKPIs />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardHeader><CardTitle>Distribuição por Status</CardTitle></CardHeader>
                    <CardContent>{statusDistribution.length ? renderDonut : <p className="text-sm text-muted-foreground">Sem dados</p>}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Top 5 Modelos por Lucro</CardTitle></CardHeader>
                    <CardContent>{top5.length ? renderTop5Bar : <p className="text-sm text-muted-foreground">Sem dados</p>}</CardContent>
                </Card>
            </div>

            {/* Alerta no lugar do gráfico agregado */}
            <div className="grid grid-cols-1 mt-6">
                <StaleVehiclesCard />
            </div>
        </>
    )


    const DonoDashboard = () => (
        <>
            <CardsKPIs />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="h-[360px]">
                    <CardHeader className="pb-2">
                        <CardTitle>Distribuição do Estoque</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {statusDistribution.length
                            ? renderDonut
                            : <p className="text-sm text-muted-foreground">Sem dados</p>}
                    </CardContent>
                </Card>

                <Card className="h-[360px]">
                    <CardHeader className="pb-2">
                        <CardTitle>Modelos com Melhor Margem</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {top5.length
                            ? renderTop5Bar
                            : <p className="text-sm text-muted-foreground">Sem dados</p>}
                    </CardContent>
                </Card>
            </div>



            <div className="grid grid-cols-1 mt-6">
                <StaleVehiclesCard />
            </div>
        </>
    )


    const VendedorDashboard = () => (
        <>
            <CardsKPIs />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardHeader><CardTitle>Meus Veículos por Status</CardTitle></CardHeader>
                    <CardContent>{statusDistribution.length ? renderDonut : <p className="text-sm text-muted-foreground">Sem dados</p>}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Meus Melhores Lucros</CardTitle></CardHeader>
                    <CardContent>{top5.length ? renderTop5Bar : <p className="text-sm text-muted-foreground">Sem dados</p>}</CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 mt-6">
                <Card>
                    <CardHeader><CardTitle>Minha Meta de Vendas</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span>Vendas realizadas</span>
                            <span className="font-medium">{mySoldCount}/{SELL_TARGET}</span>
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
        </>
    )

    const StaleVehiclesCard = () => (
        <Card>
            <CardHeader>
                <CardTitle>
                    Veículos parados há mais de {STALE_DAYS_THRESHOLD} dias
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {staleVehicles.length === 0 ? (
                    <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                        Nenhum veículo parado além de {STALE_DAYS_THRESHOLD} dias. Bom sinal! 🚀
                    </p>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
                            <span className="font-medium">
                                {staleVehicles.length} veículo(s) em alerta
                            </span>
                            <span className="text-xs md:text-sm text-muted-foreground">
                                Capital travado em estoque:{" "}
                                <span className="font-semibold">
                                    {formatCurrency(staleInventoryValue)}
                                </span>
                            </span>
                        </div>

                        <div className="space-y-2">
                            {staleVehicles.slice(0, 5).map((v) => (
                                <div
                                    key={v.id}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
                                >
                                    <div className="text-sm">
                                        <p className="font-medium">
                                            {v.brand} {v.model} {v.year}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Entrada:{" "}
                                            {v.entryDate
                                                ? new Date(v.entryDate).toLocaleDateString("pt-BR")
                                                : "—"}{" "}
                                            • Compra: {formatCurrency(v.purchasePrice)}
                                        </p>
                                    </div>
                                    <div className="text-xs md:text-sm font-semibold text-amber-800">
                                        {(v.daysStopped as number)} dias parado
                                    </div>
                                </div>
                            ))}
                            {staleVehicles.length > 5 && (
                                <p className="text-xs text-muted-foreground">
                                    +{staleVehicles.length - 5} veículo(s) também em alerta.
                                </p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )


    // ===== RENDER =====
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
                {/* Tabs simples (internas ao dashboard) */}
                <div className="flex gap-2 mb-6">
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "dashboard" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                        onClick={() => setActiveTab("dashboard")}
                    >
                        Visão Geral
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "fipe" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                        onClick={() => setActiveTab("fipe")}
                    >
                        FIPE
                    </button>
                </div>

                {/* VISÃO GERAL */}
                {activeTab === "dashboard" && (
                    <>
                        <h2 className="text-2xl font-bold mb-6">
                            Dashboard {profile === "owner" ? "— Visão Global" : profile === "dono" ? "— Minha Loja" : "— Meu Desempenho"}
                        </h2>

                        {profile === "owner" && <OwnerDashboard />}
                        {profile === "dono" && <DonoDashboard />}
                        {profile === "vendedor" && <VendedorDashboard />}
                    </>
                )}

                {/* FIPE */}
                {activeTab === "fipe" && (
                    <>
                        <h2 className="text-2xl font-bold mb-6">Tabela FIPE</h2>
                        <Card>
                            <CardHeader>
                                <CardTitle>Consulta FIPE</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Componente que consome https://fipeapi.com.br/documentacao.php */}
                                <FipeSearch />
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </ProtectedRoute>
    )
}
