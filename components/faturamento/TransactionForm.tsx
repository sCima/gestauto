"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Transaction, TransactionType } from "@/types/transaction"
import { nextMonthISO } from "@/lib/utils"
import { Plus } from "lucide-react"

interface Props {
    onSubmit: (t: Transaction) => void
    toEdit?: Transaction | null
    onClearEdit?: () => void
}

export default function TransactionForm({ onSubmit, toEdit, onClearEdit }: Props) {
    const [open, setOpen] = useState(false)
    const [tipo, setTipo] = useState<TransactionType>("entrada")
    const [valor, setValor] = useState<string>("")
    const [descricao, setDescricao] = useState("")
    const [categoria, setCategoria] = useState("")
    const [data, setData] = useState<string>(new Date().toISOString().split("T")[0])
    const [recorrente, setRecorrente] = useState(false)

    useEffect(() => {
        if (toEdit) {
            setTipo(toEdit.tipo)
            setValor(String(toEdit.valor))
            setDescricao(toEdit.descricao)
            setCategoria(toEdit.categoria)
            setData(toEdit.data)
            setRecorrente(!!toEdit.recorrente)
            setOpen(true)
        }
    }, [toEdit])

    function reset() {
        setTipo("entrada")
        setValor("")
        setDescricao("")
        setCategoria("")
        setData(new Date().toISOString().split("T")[0])
        setRecorrente(false)
        onClearEdit?.()
    }

    function handleSave() {
        const v = parseFloat(valor)
        if (!valor || isNaN(v) || v <= 0 || !descricao.trim()) return

        const tx: Transaction = {
            id: toEdit?.id || String(Date.now()),
            tipo,
            valor: v,
            descricao: descricao.trim(),
            categoria: categoria.trim() || "Outros",
            data,
            recorrente,
            proximaOcorrencia: recorrente ? nextMonthISO(data) : undefined,
        }

        onSubmit(tx)
        setOpen(false)
        reset()
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                setOpen(o)
                if (!o) reset()
            }}
        >
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Movimentação
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{toEdit ? "Editar Movimentação" : "Nova Movimentação"}</DialogTitle>
                    <DialogDescription>
                        {toEdit ? "Atualize os dados da movimentação" : "Adicione uma nova entrada ou saída financeira"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Tipo</Label>
                        <Select value={tipo} onValueChange={(v: TransactionType) => setTipo(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="entrada">Entrada</SelectItem>
                                <SelectItem value="saida">Saída</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Valor (R$)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            placeholder="0,00"
                            className="text-right"
                        />
                    </div>

                    <div>
                        <Label>Descrição</Label>
                        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Venda Corolla" />
                    </div>

                    <div>
                        <Label>Categoria</Label>
                        <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Venda, Serviço, Aluguel..." />
                    </div>

                    <div>
                        <Label>Data</Label>
                        <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="rec" checked={recorrente} onCheckedChange={(c) => setRecorrente(!!c)} />
                        <Label htmlFor="rec">Transação recorrente (mensal)</Label>
                    </div>

                    <Button className="w-full" onClick={handleSave}>
                        {toEdit ? "Salvar Alterações" : "Adicionar Movimentação"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
