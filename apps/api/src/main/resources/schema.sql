CREATE TABLE IF NOT EXISTS product (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    price TEXT NOT NULL
);

-- Datos iniciales solo si la tabla está vacía
INSERT INTO product (name, price)
SELECT column1, column2 FROM (VALUES ('Teclado', '499.90'), ('Mouse', '249.50'))
WHERE NOT EXISTS (SELECT 1 FROM product);
