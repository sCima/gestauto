import { Client } from "pg"
import fs from "fs"

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function migrate() {
  await client.connect()

  // 🔹 exporta localStorage manualmente do browser
  const rawVehicles = JSON.parse(
    fs.readFileSync("./export/vehicles.json", "utf-8")
  )

  const rawTransactions = JSON.parse(
    fs.readFileSync("./export/transactions.json", "utf-8")
  )

  console.log("Migrando veículos...")

  for (const v of rawVehicles) {
    await client.query(
      `
      INSERT INTO vehicles (
        id, brand, model, year, color,
        purchase_price, fipe_price,
        expected_sale_price, expected_profit,
        status, entry_date, notes
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,
        $10,$11,$12
      )
      ON CONFLICT (id) DO NOTHING
      `,
      [
        v.id,
        v.brand,
        v.model,
        v.year,
        v.color || null,
        v.purchasePrice,
        v.fipePrice || null,
        v.expectedSalePrice || null,
        v.expectedProfit || null,
        v.status,
        v.entryDate,
        v.notes || null,
      ]
    )

    // se foi vendido, cria registro de venda
    if (v.status === "vendido" && v.salePrice) {
      await client.query(
        `
        INSERT INTO vehicle_sales (
          vehicle_id, sale_price, profit, sold_at
        ) VALUES ($1,$2,$3,$4)
        ON CONFLICT DO NOTHING
        `,
        [
          v.id,
          v.salePrice,
          v.salePrice - v.purchasePrice,
          v.entryDate,
        ]
      )
    }
  }

  console.log("Migrando transações...")

  for (const t of rawTransactions) {
    await client.query(
      `
      INSERT INTO transactions (
        id, type, value, category,
        description, date,
        recurring, next_occurrence
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      ON CONFLICT (id) DO NOTHING
      `,
      [
        t.id,
        t.tipo,
        t.valor,
        t.categoria,
        t.descricao,
        t.data,
        t.recorrente,
        t.proximaOcorrencia || null,
      ]
    )
  }

  await client.end()
  console.log("✅ Migração concluída")
}

migrate().catch(console.error)
