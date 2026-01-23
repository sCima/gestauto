import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getMockUser } from "@/lib/auth"

export async function GET() {
  const txs = await sql`
    SELECT *
    FROM transactions
    ORDER BY date DESC
  `
  return NextResponse.json(txs)
}

export async function POST(req: Request) {
  const user = getMockUser()
  const body = await req.json()

  const [tx] = await sql`
    INSERT INTO transactions (
      type, value, category, description,
      date, recurring, next_occurrence, created_by
    ) VALUES (
      ${body.tipo},
      ${body.valor},
      ${body.categoria},
      ${body.descricao},
      ${body.data},
      ${body.recorrente},
      ${body.proximaOcorrencia},
      ${user.id}
    )
    RETURNING *
  `

  return NextResponse.json(tx)
}
