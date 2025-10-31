import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

dotenv.config();

// ===============================
// Basic Setup
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const dbFolder = path.join(__dirname, "db");
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

// ✅ Deteksi apakah sedang dijalankan di Vercel
const isVercel = process.env.VERCEL === "1";
const DB_FILE = isVercel ? ":memory:" : path.join(dbFolder, "nava.db");

if (isVercel) {
  console.log("⚙️ Vercel environment terdeteksi: menggunakan in-memory SQLite");
} else {
  console.log("✅ Menggunakan file DB lokal:", DB_FILE);
}

let db;

// ===============================
// Database Init
// ===============================
async function initDB() {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });
  await db.exec("PRAGMA foreign_keys = ON;");
  await createTables();
  await seedIfEmpty();
  console.log("✅ Database ready!");
}
initDB();

// ===============================
// Create Tables
// ===============================
async function createTables() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category TEXT,
      image TEXT,
      description TEXT DEFAULT '',
      stock INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      title TEXT,
      price INTEGER,
      stock INTEGER DEFAULT 0,
      description TEXT DEFAULT '',
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      variant_id INTEGER,
      name TEXT,
      contact TEXT,
      method TEXT,
      total INTEGER,
      status TEXT DEFAULT 'pending',
      createdAt TEXT
    );
  `);
}

// ===============================
// Seed Data
// ===============================
async function seedIfEmpty() {
  const row = await db.get("SELECT COUNT(*) AS c FROM products");
  if (row.c > 0) return;

  console.log("⏳ Seeding products...");

  const products = [
    { name: "Netflix", category: "Streaming", image: "img/netflix.png" },
    { name: "Canva Pro", category: "Editing", image: "img/canva.png" },
    { name: "Spotify", category: "Streaming", image: "img/spotify.png" },
    { name: "ChatGPT", category: "AI Tools", image: "img/chatgpts.png" },
  ];

  const V = (title, price = 10000, stock = 10) => ({ title, price, stock });
  const variants = {
    "Netflix": [V("Private 1 Bulan"), V("Sharing 1 Bulan")],
    "Canva Pro": [V("1 Bulan"), V("6 Bulan")],
    "Spotify": [V("Private 1 Bulan"), V("Sharing 1 Bulan")],
    "ChatGPT": [V("Plus 1 Bulan")],
  };

  for (const p of products) {
    const result = await db.run(
      "INSERT INTO products (name, category, image, stock) VALUES (?,?,?,0)",
      [p.name, p.category, p.image]
    );
    const pid = result.lastID;

    for (const v of variants[p.name] || []) {
      await db.run(
        "INSERT INTO product_variants (product_id, title, price, stock) VALUES (?,?,?,?)",
        [pid, v.title, v.price, v.stock]
      );
    }

    await db.run(
      `UPDATE products
       SET stock = (SELECT COALESCE(SUM(stock),0) FROM product_variants WHERE product_id=?)
       WHERE id=?`,
      [pid, pid]
    );
  }

  console.log("✅ Seeding done");
}

// ===============================
// Auth
// ===============================
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@mail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

function verifyToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid Token" });
  }
}

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: "Email/Password salah" });
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

// ===============================
// Public API
// ===============================
app.get("/api/products", async (req, res) => {
  let products = await db.all("SELECT * FROM products");
  if (products.length === 0) {
    console.log("⚠️ Produk kosong, jalankan seed ulang...");
    await seedIfEmpty();
    products = await db.all("SELECT * FROM products");
  }

  const result = [];
  for (const p of products) {
    const variants = await db.all(
      "SELECT id, title, price, stock, description FROM product_variants WHERE product_id=?",
      [p.id]
    );
    const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    result.push({ ...p, stock: totalStock, variants });
  }
  res.json(result);
});

// ===============================
// Orders API
// ===============================
app.post("/api/orders", async (req, res) => {
  const { product_id, variant_id, name, contact, method, total } = req.body;
  const createdAt = new Date().toISOString();
  const result = await db.run(
    `INSERT INTO orders (product_id, variant_id, name, contact, method, total, createdAt)
     VALUES (?,?,?,?,?,?,?)`,
    [product_id, variant_id, name, contact, method, total, createdAt]
  );

  await db.run("UPDATE product_variants SET stock = stock - 1 WHERE id=?", [variant_id]);
  await db.run(
    `UPDATE products
     SET stock = (SELECT COALESCE(SUM(stock),0) FROM product_variants WHERE product_id=?)
     WHERE id=?`,
    [product_id, product_id]
  );

  res.json({ id: result.lastID });
});

// ===============================
// Admin API
// ===============================
app.get("/api/admin/products", verifyToken, async (req, res) => {
  const products = await db.all("SELECT * FROM products");
  const result = [];
  for (const p of products) {
    const variants = await db.all(
      "SELECT id, title, price, stock, description FROM product_variants WHERE product_id=?",
      [p.id]
    );
    const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    result.push({ ...p, stock: totalStock, variants });
  }
  res.json(result);
});

app.get("/api/admin/orders", verifyToken, async (req, res) => {
  const rows = await db.all(`
    SELECT o.*, p.name AS product_name, v.title AS variant_title
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    LEFT JOIN product_variants v ON v.id = o.variant_id
    ORDER BY o.id DESC
  `);
  res.json(rows);
});

// ===============================
// HTTPS Redirect & Fallback
// ===============================
app.use((req, res, next) => {
  if (req.headers.host && req.headers.host.startsWith("www.")) {
    return res.redirect(301, "https://" + req.headers.host.slice(4) + req.url);
  }
  if (req.headers["x-forwarded-proto"] !== "https" && isVercel) {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===============================
// Run Server
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
