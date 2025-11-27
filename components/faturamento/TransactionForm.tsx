"use client"

import { useEffect, useState } from "react"
import { Transaction } from "@/types/transaction"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface TransactionFormProps {
    onAdd?: (tx: Transaction) => void
    onSubmit?: (tx: Transaction) => void
    toEdit: Transaction | null
    onClearEdit: () => void
    className?: string
}

export default function TransactionForm({
    onAdd,
    onSubmit,
    toEdit,
    onClearEdit,
    className,
}: TransactionFormProps) {

    const [tipo, setTipo] = useState<"entrada" | "saida">("entrada")
    const [valorStr, setValorStr] = useState("")
    const [descricao, setDescricao] = useState("")
    const [categoria, setCategoria] = useState("")
    const [data, setData] = useState("")
    const [recorrente, setRecorrente] = useState(false)
    const [proximaOcorrencia, setProximaOcorrencia] = useState("")

    // =========================
    //   CARREGAR EDIÇÃO
    // =========================
    useEffect(() => {
        if (toEdit) {
            setTipo(toEdit.tipo)
            setValorStr(formatCurrency(toEdit.valor))
            setDescricao(toEdit.descricao)
            setCategoria(toEdit.categoria)
            setData(toEdit.data)
            setRecorrente(Boolean(toEdit.recorrente))
            setProximaOcorrencia(toEdit.proximaOcorrencia || "")
        }
    }, [toEdit])

    // =========================
    //   RESET FORM
    // =========================
    function reset() {
        setTipo("entrada")
        setValorStr("")
        setDescricao("")
        setCategoria("")
        setData("")
        setRecorrente(false)
        setProximaOcorrencia("")
    }

    // =========================
    //   SUBMIT
    // =========================
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const valorNumber = Number(valorStr.replace(/\D/g, "")) / 100
        if (!valorNumber || valorNumber <= 0) return alert("Valor inválido.")
        if (!descricao.trim()) return alert("Descrição obrigatória.")
        if (!data) return alert("Selecione a data.")

        const tx: Transaction = {
            id: toEdit?.id ?? crypto.randomUUID(),
            tipo,
            valor: valorNumber,
            descricao: descricao.trim(),
            categoria: categoria || (tipo === "entrada" ? "Receita" : "Despesa"),
            data,
            recorrente,
            proximaOcorrencia: recorrente ? proximaOcorrencia : undefined,
        }

        // aceita tanto onAdd quanto onSubmit
        const handler = onSubmit ?? onAdd
        if (!handler) {
            console.error("Nenhum handler fornecido ao TransactionForm")
            return
        }

        handler(tx)

        onClearEdit()
        reset()
    }

    // =========================
    //   FORMATAR DINHEIRO
    // =========================
    function handleValorChange(v: string) {
        const num = Number(v.replace(/\D/g, "")) / 100
        setValorStr(formatCurrency(num))
    }

    // =========================
    //   UI
    // =========================
    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "p-4 border rounded-md flex items-center gap-3 bg-white dark:bg-black shadow-sm",
                className
            )}
        >
            {/* Tipo */}
            <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="border rounded p-2"
            >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
            </select>

            {/* Valor */}
            <Input
                placeholder="R$"
                value={valorStr}
                onChange={(e) => handleValorChange(e.target.value)}
                className="w-36"
            />

            {/* Descrição */}
            <Input
                placeholder="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-52"
            />

            {/* Categoria */}
            <Input
                placeholder="Categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-40"
            />

            {/* Data */}
            <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-40"
            />

            {/* Recorrente */}
            <div className="flex items-center gap-2">
                <Label>Recorrente</Label>
                <Switch
                    checked={recorrente}
                    onCheckedChange={(v) => setRecorrente(v)}
                />
            </div>

            {recorrente && (
                <Input
                    type="date"
                    value={proximaOcorrencia}
                    onChange={(e) => setProximaOcorrencia(e.target.value)}
                    className="w-40"
                />
            )}

            <Button type="submit">
                {toEdit ? "Salvar" : "Adicionar"}
            </Button>
        </form>
    )
}
