-- =========================
-- EXTENSÕES
-- =========================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- USUÁRIOS (Firebase Auth)
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(120),
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'seller')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- VEÍCULOS (ESTOQUE)
-- =========================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand VARCHAR(80) NOT NULL,
    model VARCHAR(120) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(50),
    purchase_price NUMERIC(12,2) NOT NULL,
    fipe_price NUMERIC(12,2),
    expected_sale_price NUMERIC(12,2),
    expected_profit NUMERIC(12,2),
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('preparacao', 'pronto', 'vendido', 'finalizado')),
    entry_date DATE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- VENDAS DE VEÍCULOS
-- (LUCRO REAL)
-- =========================
CREATE TABLE vehicle_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    sale_price NUMERIC(12,2) NOT NULL,
    profit NUMERIC(12,2) NOT NULL,
    sold_at DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- TRANSAÇÕES FINANCEIRAS
-- =========================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL
        CHECK (type IN ('entrada', 'saida')),
    value NUMERIC(12,2) NOT NULL,
    category VARCHAR(80),
    description TEXT,
    date DATE NOT NULL,
    recurring BOOLEAN DEFAULT FALSE,
    next_occurrence DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- DESPESAS OPERACIONAIS
-- (opcional, pode usar só transactions)
-- =========================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(120) NOT NULL,
    value NUMERIC(12,2) NOT NULL,
    category VARCHAR(80),
    date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- ÍNDICES (PERFORMANCE)
-- =========================
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_entry_date ON vehicles(entry_date);

CREATE INDEX idx_vehicle_sales_vehicle_id ON vehicle_sales(vehicle_id);
CREATE INDEX idx_vehicle_sales_sold_at ON vehicle_sales(sold_at);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

CREATE INDEX idx_expenses_date ON expenses(date);

-- =========================
-- VIEW: LUCRO MENSAL
-- =========================
CREATE VIEW monthly_profit AS
SELECT
    DATE_TRUNC('month', date) AS month,
    SUM(CASE WHEN type = 'entrada' THEN value ELSE 0 END) -
    SUM(CASE WHEN type = 'saida' THEN value ELSE 0 END) AS profit
FROM transactions
GROUP BY 1
ORDER BY 1 DESC;

-- =========================
-- VIEW: FATURAMENTO MENSAL
-- =========================
CREATE VIEW monthly_revenue AS
SELECT
    DATE_TRUNC('month', date) AS month,
    SUM(CASE WHEN type = 'entrada' THEN value ELSE 0 END) AS total_entradas,
    SUM(CASE WHEN type = 'saida' THEN value ELSE 0 END) AS total_saidas
FROM transactions
GROUP BY 1
ORDER BY 1 DESC;

-- =========================
-- VIEW: VEÍCULOS PARADOS
-- =========================
CREATE VIEW stalled_vehicles AS
SELECT
    v.*,
    (CURRENT_DATE - v.entry_date) AS days_in_stock
FROM vehicles v
WHERE v.status IN ('preparacao', 'pronto');

-- =========================
-- VIEW: MARGEM POR VEÍCULO
-- =========================
CREATE VIEW vehicle_margins AS
SELECT
    v.id,
    v.brand,
    v.model,
    v.year,
    s.sale_price,
    v.purchase_price,
    s.profit
FROM vehicle_sales s
JOIN vehicles v ON v.id = s.vehicle_id;
