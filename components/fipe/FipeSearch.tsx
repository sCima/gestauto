"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Vehicle } from "@/data/vehicles"

interface FipeSearchProps {
    onSaveFipe?: (vehicleInfo: any) => void
}

export default function FipeSearch({ onSaveFipe }: FipeSearchProps) {
    const [brand, setBrand] = useState("")
    const [model, setModel] = useState("")
    const [brands, setBrands] = useState<any[]>([])
    const [models, setModels] = useState<any[]>([])
    const [years, setYears] = useState<any[]>([])
    const [vehicleInfo, setVehicleInfo] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Buscar marcas digitando
    useEffect(() => {
        if (brand.length < 2) return
        fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas")
            .then(res => res.json())
            .then(data =>
                setBrands(
                    data.filter((b: any) =>
                        b.nome.toLowerCase().includes(brand.toLowerCase())
                    )
                )
            )
    }, [brand])

    // Selecionou marca
    const handleSelectBrand = (codigo: string, nome: string) => {
        setBrand(nome)
        setVehicleInfo(null)
        fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${codigo}/modelos`)
            .then(res => res.json())
            .then(data => setModels(data.modelos))
    }

    // Selecionou modelo
    const handleSelectModel = (codigoModelo: string, nomeModelo: string) => {
        setModel(nomeModelo)
        fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brands.find(b => b.nome === brand)?.codigo}/modelos/${codigoModelo}/anos`)
            .then(res => res.json())
            .then(data =>
                setYears(data.filter((y: any) => y.codigo !== "32000")) // ✅ ignora ano 32000
            )
    }

    // Selecionou ano
    const handleSelectYear = (codigoAno: string) => {
        setLoading(true)
        const marcaCode = brands.find(b => b.nome === brand)?.codigo
        const modeloCode = models.find(m => m.nome === model)?.codigo

        fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaCode}/modelos/${modeloCode}/anos/${codigoAno}`)
            .then(res => res.json())
            .then(data => setVehicleInfo(data))
            .finally(() => setLoading(false))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Consulta FIPE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Marca */}
                <Input
                    placeholder="Digite a marca..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                />

                {brands.length > 0 && (
                    <div className="border rounded max-h-40 overflow-y-auto">
                        {brands.map(b => (
                            <div key={b.codigo} className="p-2 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSelectBrand(b.codigo, b.nome)}>
                                {b.nome}
                            </div>
                        ))}
                    </div>
                )}

                {/* Modelo */}
                {brand && models.length > 0 && (
                    <Input
                        placeholder="Digite o modelo..."
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                )}

                {model && models.length > 0 && (
                    <div className="border rounded max-h-40 overflow-y-auto">
                        {models
                            .filter(m => m.nome.toLowerCase().includes(model.toLowerCase()))
                            .map(m => (
                                <div key={m.codigo} className="p-2 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSelectModel(m.codigo, m.nome)}>
                                    {m.nome}
                                </div>
                            ))}
                    </div>
                )}

                {/* Ano */}
                {years.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {years.map((y: any) => (
                            <button key={y.codigo}
                                onClick={() => handleSelectYear(y.codigo)}
                                className="px-3 py-1 border rounded hover:bg-gray-200">
                                {y.nome}
                            </button>
                        ))}
                    </div>
                )}

                {/* Resultado */}
                {loading && <Loader2 className="animate-spin" />}
                {vehicleInfo && vehicleInfo.AnoModelo !== 32000 && (
                    <div className="bg-gray-50 p-4 rounded border space-y-2">
                        <p><strong>Modelo:</strong> {vehicleInfo.Modelo}</p>
                        <p><strong>Ano:</strong> {vehicleInfo.AnoModelo}</p>
                        <p><strong>Combustível:</strong> {vehicleInfo.Combustivel}</p>
                        <p><strong>Preço FIPE:</strong> {vehicleInfo.Valor}</p>
                        {onSaveFipe && (
                            <button
                                onClick={() => onSaveFipe(vehicleInfo)}
                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                Salvar no Veículo
                            </button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
