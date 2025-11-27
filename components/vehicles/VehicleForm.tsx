"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Car } from "lucide-react"
import { toast } from "sonner"


export interface VehicleFormData {
    brand: string
    model: string
    year: string
    purchasePrice: string
    fipePrice: string
    status: "preparacao" | "pronto" | "vendido" | "finalizado"
    entryDate: string
    expectedSalePrice: string
    expectedProfit: string
    color: string        
    notes: string        
}

export default function VehicleForm({ onSubmit }: { onSubmit: (data: VehicleFormData) => void }) {

    const [brands, setBrands] = useState<any[]>([])
    const [models, setModels] = useState<any[]>([])
    const [years, setYears] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState<VehicleFormData>({
        brand: "",
        model: "",
        year: "",
        purchasePrice: "",
        fipePrice: "",
        expectedSalePrice: "",
        expectedProfit: "",
        status: "preparacao",
        entryDate: "",
        color: "",
        notes: "",
    })



    useEffect(() => {
        fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas")
            .then(res => res.json())
            .then(data => setBrands(data))
    }, [])

    const handleBrand = (codigo: string, nome: string) => {
        setForm(prev => ({ ...prev, brand: nome, model: "", year: "" }))
        setModels([])
        setYears([])

        fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${codigo}/modelos`)
            .then(res => res.json())
            .then(data => setModels(data.modelos))
    }

    const handleModel = (codigo: string, nome: string) => {
        setForm(prev => ({ ...prev, model: nome, year: "" }))
        setYears([])

        const brandCode = brands.find(b => b.nome === form.brand)?.codigo
        if (!brandCode) return

        fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos/${codigo}/anos`)
            .then(res => res.json())
            .then(data => setYears(data)) // sem filter aqui
    }


    const handleYearAndFipe = (codigoAno: string) => {
        const brandCode = brands.find(b => b.nome === form.brand)?.codigo
        const modelCode = models.find(m => m.nome === form.model)?.codigo

        const yearObj = years.find((y: any) => y.codigo === codigoAno)
        const first = yearObj ? String(yearObj.nome).split(" ")[0] : ""
        const currentYear = new Date().getFullYear()

        let yearNumber: number

        if (first === "32000") {
            yearNumber = currentYear          // ou currentYear + 1, se preferir
        } else {
            yearNumber = parseInt(first, 10)
        }

        setForm(prev => ({
            ...prev,
            year: Number.isNaN(yearNumber) ? "" : String(yearNumber),
        }))

        if (!brandCode || !modelCode) return

        setLoading(true)
        fetch(
            `https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos/${modelCode}/anos/${codigoAno}`
        )
            .then(res => res.json())
            .then(data => {
                const fipe = data.Valor ? data.Valor : ""

                setForm(prev => ({
                    ...prev,
                    fipePrice: fipe,
                }))
            })
            .finally(() => setLoading(false))
    }




    const formatCurrency = (value: string) => {
        const number = value.replace(/\D/g, "")
        return (Number(number) / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.brand || !form.model || !form.year || !form.purchasePrice) {
            toast.error("Não foi possível cadastrar", {
                description: "Preencha Marca, Modelo, Ano e Valor de Compra.",
            })
            return
        }

        onSubmit(form)
    }


    return (
        <Card className="p-4">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex gap-2 items-center">
                    <Car className="w-5 h-5" /> Cadastrar Veículo (FIPE)
                </CardTitle>
            </CardHeader>

            <CardContent>
                {/* FORM começa aqui */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Marca e Modelo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Marca</label>
                            <Select
                                onValueChange={v => {
                                    const [codigo, nome] = v.split("|")
                                    handleBrand(codigo, nome)
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {brands.map(b => (
                                        <SelectItem key={b.codigo} value={`${b.codigo}|${b.nome}`}>
                                            {b.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Modelo</label>
                            <Select
                                onValueChange={v => {
                                    const [codigo, nome] = v.split("|")
                                    handleModel(codigo, nome)
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map(m => (
                                        <SelectItem key={m.codigo} value={`${m.codigo}|${m.nome}`}>
                                            {m.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Valor de Compra + Ano */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="text-sm font-medium">Valor de Compra</label>
                            <Input
                                placeholder="R$ 0,00"
                                value={form.purchasePrice}
                                onChange={e => {
                                    const raw = e.target.value
                                    const digits = raw.replace(/\D/g, "")
                                    const purchaseNumber = Number(digits) / 100
                                    const formattedPurchase = purchaseNumber.toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                    })

                                    const expectedNumber = form.expectedSalePrice
                                        ? Number(form.expectedSalePrice.replace(/\D/g, "")) / 100
                                        : 0

                                    const profit = expectedNumber - purchaseNumber

                                    setForm(prev => ({
                                        ...prev,
                                        purchasePrice: formattedPurchase,
                                        expectedProfit:
                                            profit > 0
                                                ? profit.toLocaleString("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                })
                                                : "R$ 0,00",
                                    }))
                                }}
                            />

                        </div>

                        {/* Valor Esperado */}
                        <div>
                            <label className="text-sm font-medium">Valor Esperado</label>
                            <Input
                                placeholder="R$ 0,00"
                                value={form.expectedSalePrice}
                                onChange={e => {
                                    const raw = e.target.value
                                    const digits = raw.replace(/\D/g, "")
                                    const expectedNumber = Number(digits) / 100
                                    const formattedExpected = expectedNumber.toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                    })

                                    const purchaseNumber = form.purchasePrice
                                        ? Number(form.purchasePrice.replace(/\D/g, "")) / 100
                                        : 0

                                    const profit = expectedNumber - purchaseNumber

                                    setForm(prev => ({
                                        ...prev,
                                        expectedSalePrice: formattedExpected,
                                        expectedProfit:
                                            profit > 0
                                                ? profit.toLocaleString("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                })
                                                : "R$ 0,00",
                                    }))
                                }}
                            />
                        </div>

                        {/* Valor FIPE (somente leitura) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Valor FIPE</label>
                                <Input
                                    readOnly
                                    disabled
                                    value={form.fipePrice || ""}
                                    placeholder="Selecione marca, modelo e ano"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Ano</label>
                            <Select
                                disabled={years.length === 0}
                                onValueChange={v => handleYearAndFipe(v)}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            years.length === 0 ? "Selecione o modelo" : "Ano"
                                        }
                                    />
                                </SelectTrigger>
                                {years.length > 0 && (
                                    <SelectContent>
                                        {years.map((y) => {
                                            const first = String(y.nome).split(" ")[0]
                                            const isZeroKm = first === "32000"

                                            return (
                                                <SelectItem key={y.codigo} value={y.codigo}>
                                                    {isZeroKm ? "Zero km (ano atual)" : y.nome}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>

                                )}
                            </Select>
                        </div>
                    </div>

                    {/* Data de entrada */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Data de entrada</label>
                            <Input
                                type="date"
                                value={form.entryDate}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, entryDate: e.target.value }))
                                }
                            />
                        </div>
                    </div>

                    {/* Cor e Observações */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Cor</label>
                            <Input
                                placeholder="Ex: Preto, Prata, Branco Pérola"
                                value={form.color}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, color: e.target.value }))
                                }
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Observações</label>
                            <textarea
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Ex: único dono, revisões em dia, pneus novos..."
                                value={form.notes}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, notes: e.target.value }))
                                }
                            />
                        </div>
                    </div>


                    {/* Botão */}
                    <div className="flex justify-start mt-4">
                        <Button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Cadastrar"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
