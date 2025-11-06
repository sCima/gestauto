"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Car } from "lucide-react"

export interface VehicleFormData {
    brand: string
    model: string
    year: string
    purchasePrice: string
    fipePrice: string
    status: "preparacao" | "pronto" | "vendido" | "finalizado"
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
        status: "preparacao",
    })

    useEffect(() => {
        fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas")
            .then(res => res.json())
            .then(data => setBrands(data))
    }, [])

    const handleBrand = (codigo: string, nome: string) => {
        setForm(prev => ({ ...prev, brand: nome, model: "", year: "" }))
        fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${codigo}/modelos`)
            .then(res => res.json())
            .then(data => setModels(data.modelos))
    }

    const handleModel = (codigo: string, nome: string) => {
        setForm(prev => ({ ...prev, model: nome, year: "" }))
        const brandCode = brands.find(b => b.nome === form.brand)?.codigo
        fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos/${codigo}/anos`)
            .then(res => res.json())
            .then(data => setYears(data.filter((y: any) => y.codigo !== "32000")))
    }

    const handleYearAndFipe = (codigoAno: string) => {
        const brandCode = brands.find(b => b.nome === form.brand)?.codigo
        const modelCode = models.find(m => m.nome === form.model)?.codigo

        setForm(prev => ({ ...prev, year: codigoAno }))
        if (!brandCode || !modelCode) return

        setLoading(true)
        fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos/${modelCode}/anos/${codigoAno}`)
            .then(res => res.json())
            .then(data => {
                setForm(prev => ({ ...prev, fipePrice: data.Valor || "" }))
            })
            .finally(() => setLoading(false))
    }

    const formatCurrency = (value: string) => {
        const number = value.replace(/\D/g, "")
        return (Number(number) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }

    return (
        <Card className="p-4">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex gap-2 items-center">
                    <Car className="w-5 h-5" /> Cadastrar Veículo (FIPE)
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Marca e Modelo Lado a Lado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Marca</label>
                        <Select onValueChange={(v) => {
                            const [codigo, nome] = v.split("|")
                            handleBrand(codigo, nome)
                        }}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                {brands.map(b => (
                                    <SelectItem key={b.codigo} value={`${b.codigo}|${b.nome}`}>{b.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Modelo</label>
                        <Select onValueChange={(v) => {
                            const [codigo, nome] = v.split("|")
                            handleModel(codigo, nome)
                        }}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                {models.map(m => (
                                    <SelectItem key={m.codigo} value={`${m.codigo}|${m.nome}`}>{m.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Ano e Valor Lado a Lado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {years.length > 0 && (
                        <div>
                            <label className="text-sm font-medium">Ano</label>
                            <Select onValueChange={(v) => handleYearAndFipe(v)}>
                                <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y.codigo} value={y.codigo}>{y.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium">Valor de Compra</label>
                        <Input
                            placeholder="R$ 0,00"
                            value={form.purchasePrice}
                            onChange={(e) =>
                                setForm(prev => ({ ...prev, purchasePrice: formatCurrency(e.target.value) }))
                            }
                        />
                    </div>
                </div>

                {/* Botão de cadastrar */}
                <div className="flex justify-start mt-4">
                    <Button
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                        disabled={loading}
                        onClick={() => onSubmit(form)}
                    >
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Cadastrar"}
                    </Button>
                </div>

            </CardContent>
        </Card>
    )
}
