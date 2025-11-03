"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Repeat } from "lucide-react"
import { Transaction } from "@/types/transaction"
import { formatBRL } from "@/lib/utils"

interface Props {
    transactions: Transaction[]
    onEdit: (t: Transaction) => void
    onDelete: (id: string) => void
}

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
    const ordered = [...transactions].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    )

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Movimentações</CardTitle>
                    <CardDescription>Entradas e saídas (mais recentes primeiro)</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {ordered.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant={t.tipo === "entrada" ? "default" : "destructive"}>
                                        {t.tipo}
                                    </Badge>
                                    <span className="font-medium">{t.categoria}</span>
                                    {t.recorrente && (
                                        <Badge variant="outline" className="border-blue-400 text-blue-700">
                                            <Repeat className="h-3 w-3 mr-1" />
                                            Mensal
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{t.descricao}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                    <span>{new Date(t.data).toLocaleDateString("pt-BR")}</span>
                                    {t.recorrente && t.proximaOcorrencia && (
                                        <span className="text-blue-600">
                                            Próxima: {new Date(t.proximaOcorrencia).toLocaleDateString("pt-BR")}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${t.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                                    {t.tipo === "entrada" ? "+" : "-"}
                                    {formatBRL(t.valor)}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => onEdit(t)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => onDelete(t.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {ordered.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Nenhuma movimentação encontrada</p>
                            <p className="text-sm">Adicione sua primeira entrada/saída</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
