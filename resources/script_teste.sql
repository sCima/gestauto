-- Criar o database
CREATE DATABASE IF NOT EXISTS gestauto;
USE gestauto;

-- Usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- senha criptografada
    profile ENUM('owner', 'dono', 'vendedor', 'gestor') DEFAULT 'vendedor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuário admin 
INSERT INTO users (name, email, password, profile) VALUES
('Administrador', 'admin@gestauto.com', 'abc@1234', 'owner');

-- Veículos
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    expected_sale_price DECIMAL(12,2) NOT NULL,
    sale_price DECIMAL(12,2) DEFAULT NULL,
    status ENUM('preparacao', 'pronto', 'vendido', 'finalizado') DEFAULT 'preparacao',
    owner_email VARCHAR(100) NULL,  -- vendedor responsável
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP NULL
);

-- Dados mockados para veículos
INSERT INTO vehicles (brand, model, year, purchase_price, expected_sale_price, status)
VALUES
('Toyota', 'Corolla', 2020, 65000, 75000, 'pronto'),
('Honda', 'Civic', 2019, 58000, 68000, 'preparacao'),
('Volkswagen', 'Jetta', 2021, 72000, 82000, 'vendido');

-- Faturamento
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('entrada', 'saida') NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    recurrent BOOLEAN DEFAULT FALSE,
    next_occurrence DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dados mockados para teste
INSERT INTO transactions (type, value, description, category, date, recurrent)
VALUES
('entrada', 120000, 'Venda Corolla', 'Venda', '2025-08-10', FALSE),
('saida', 8000, 'Aluguel loja', 'Aluguel', '2025-08-05', TRUE),
('entrada', 95000, 'Venda Civic', 'Venda', '2025-09-12', FALSE),
('saida', 4500, 'Marketing digital', 'Marketing', '2025-09-15', FALSE),
('entrada', 135000, 'Venda Jetta', 'Venda', '2025-10-02', FALSE),
('saida', 12000, 'Folha de pagamento', 'Pessoal', '2025-10-05', TRUE);

-- Dados do Dashboard
CREATE VIEW vehicle_profit_view AS
SELECT
    brand,
    model,
    year,
    purchase_price,
    expected_sale_price,
    sale_price,
    (COALESCE(sale_price, expected_sale_price) - purchase_price) AS profit,
    status
FROM vehicles;
