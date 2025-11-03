"use client"

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBRL } from "@/lib/utils"

const COLORS = ["#4CAF50", "#1E88E5", "#FBC02D", "#E53935", "#8E24AA", "#00897B"]

export function RevenueVsExpenseChart({ data }: { data: { mes: string; entradas: number; saidas: number }[] }) {
    return (
        <Card>
            <CardHeader><CardTitle>Receita x Despesa (6 meses)</CardTitle></CardHeader>
            <CardContent>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 50 }}>
                            <CartesianGrid stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="mes" />
                            <YAxis tickFormatter={(v) => formatBRL(Number(v))} />
                            <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                            <Legend />
                            <Bar dataKey="entradas" name="Entradas" fill="#4CAF50" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="saidas" name="Saídas" fill="#E53935" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

export function ProfitLineChart({ data }: { data: { mes: string; lucro: number }[] }) {
    return (
        <Card>
            <CardHeader><CardTitle>Lucro Mensal (6 meses)</CardTitle></CardHeader>
            <CardContent>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 50 }}>
                            <CartesianGrid stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="mes" />
                            <YAxis tickFormatter={(v) => formatBRL(Number(v))} />
                            <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                            <Legend />
                            <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#1E88E5" strokeWidth={2} dot />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

export function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
    return (
        <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Receita por Categoria</CardTitle></CardHeader>
            <CardContent>
                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                                {data.map((entry, i) => (<Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />))}
                            </Pie>
                            <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
