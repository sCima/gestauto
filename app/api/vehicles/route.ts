import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getMockUser } from "@/lib/auth"

export async function GET() {
  const vehicles = await sql`
    SELECT *
    FROM vehicles
    ORDER BY created_at DESC
  `
  return NextResponse.json(vehicles)
}

export async function POST(req: Request) {
  const user = getMockUser()
  const body = await req.json()

  const [vehicle] = await sql`
    INSERT INTO vehicles (
      brand,
      model,
      year,
      color,
      purchase_price,
      fipe_price,
      expected_sale_price,
      expected_profit,
      status,
      entry_date,
      notes,
      created_by
    ) VALUES (
      ${body.brand},
      ${body.model},
      ${body.year},
      ${body.color || null},
      ${body.purchasePrice},
      ${body.fipePrice || null},
      ${body.expectedSalePrice || null},
      ${body.expectedProfit || null},
      ${body.status},
      ${body.entryDate},
      ${body.notes || null},
      ${user.id}
    )
    RETURNING *
  `

  return NextResponse.json(vehicle)
}
