import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getMockUser } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = getMockUser()
  const { salePrice } = await req.json()

  const [vehicle] = await sql`
    SELECT *
    FROM vehicles
    WHERE id = ${params.id}
  `

  if (!vehicle) {
    return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
  }

  const profit = salePrice - vehicle.purchase_price

  await sql`
    UPDATE vehicles
    SET status = 'vendido'
    WHERE id = ${params.id}
  `

  await sql`
    INSERT INTO vehicle_sales (
      vehicle_id,
      sale_price,
      profit,
      sold_at,
      created_by
    ) VALUES (
      ${params.id},
      ${salePrice},
      ${profit},
      CURRENT_DATE,
      ${user.id}
    )
  `

  await sql`
    INSERT INTO transactions (
      type,
      value,
      category,
      description,
      date,
      created_by
    ) VALUES (
      'entrada',
      ${profit},
      'Lucro venda veículo',
      ${`Lucro venda ${vehicle.brand} ${vehicle.model}`},
      CURRENT_DATE,
      ${user.id}
    )
  `

  return NextResponse.json({ success: true, profit })
}
