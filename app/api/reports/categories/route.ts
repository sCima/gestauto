import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await sql`SELECT * FROM category_revenue`
  return NextResponse.json(data)
}
