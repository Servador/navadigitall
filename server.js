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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const dbFolder = path.join(__dirname, "db");
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const isVercel = process.env.VERCEL === "1";
const DB_FILE = isVercel ? ":memory:" : path.join(dbFolder, "nava.db");

if (isVercel) {
  console.log("⚙️ Vercel environment terdeteksi: menggunakan in-memory SQLite");
} else {
  console.log("✅ Menggunakan file DB lokal:", DB_FILE);
}
let db;

// ✅ Inisialisasi DB
async function initDB() {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });
  await db.exec("PRAGMA foreign_keys = ON;");
  console.log("✅ Database Connected:", DB_FILE);

  await createTables();
  await seedIfEmpty(); // ✅ tambahkan ini di sini
}
initDB();

// =========================================================
// Buat tabel dari nol
// =========================================================
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

// =========================================================
// SEED DATA AWAL
// =========================================================
async function seedIfEmpty() {
  const row = await db.get("SELECT COUNT(*) AS c FROM products");
  if (row.c > 0) return;

  console.log("⏳ Seeding full catalog...");

  const products = [
  // 🌟 BEST SELLER
  { name: "Netflix", category: "Streaming", image: "img/netflix.png" },
  { name: "Vidio", category: "Streaming", image: "img/vidio.png" },
  { name: "Canva Pro", category: "Editing", image: "img/canva.png" },
  { name: "Spotify", category: "Streaming", image: "img/spotify.png" },

  // 🎬 Streaming & Hiburan
  { name: "Disney", category: "Streaming", image: "img/disney.png" },
  { name: "WeTV", category: "Streaming", image: "img/wetv.png" },
  { name: "YouTube Premium", category: "Streaming", image: "img/yt.png" },
  { name: "IQIYI", category: "Streaming", image: "img/iqiyi.png" },
  { name: "Bstation", category: "Streaming", image: "img/bstation.jpeg" },
  { name: "Loklok", category: "Streaming", image: "img/loklok.jpeg" },

  // 🧠 AI & Tools
  { name: "ChatGPT", category: "AI Tools", image: "img/chatgpts.png" },
  { name: "Gemini", category: "AI Tools", image: "img/gemini.png" },
  { name: "Perplexity", category: "AI Tools", image: "img/perplexity.png" },
  { name: "Remini", category: "AI Tools", image: "img/remini.png" },
  { name: "Dazzcam", category: "AI Tools", image: "img/dazzcam.jpeg" },
  { name: "PicsArt", category: "AI Tools", image: "img/picsart.jpeg" },
  { name: "CapCut Pro", category: "Editing", image: "img/capcut.png" },
  { name: "Alight Motion", category: "Editing", image: "img/am.jpeg" },
  { name: "Blackbox", category: "AI Tools", image: "img/blackbox.jpeg" },

  // 🌐 Layanan & Tools
  { name: "Microsoft 365", category: "Productivity", image: "img/mcs.png" },
  { name: "Zoom Pro", category: "Productivity", image: "img/zoom.png" },
  { name: "GetContact", category: "Utility", image: "img/gtc.png" },
  { name: "Jasa Pembuatan Website", category: "Utility", image: "img/website.jpeg" },
  { name: "VPN Premium", category: "VPN", image: "img/vpn.png" },

  // 💬 Sosmed & Komunitas
  { name: "Instagram", category: "Sosmed", image: "img/ig.png" },
  { name: "TikTok", category: "Sosmed", image: "img/tiktok.png" },
  { name: "Wink", category: "Sosmed", image: "img/wink.png" },

  // 🎮 Game
  { name: "Crunchyroll", category: "Streaming", image: "img/crunchyroll.png" },
  { name: "DramaBox", category: "Streaming", image: "img/drama.png" },
  { name: "Viu", category: "Streaming", image: "img/viu.png" },
];

// 2) Definisi varian (harga sementara 10000; stok 10)
const V = (title, price = 10000, stock = 10) => ({ title, price, stock });

const variants = {
  // Best Seller & Streaming
  "Netflix": [V("Private 1 Bulan"), V("Semi Private 1 Bulan"), V("Sharing 1 Bulan")],
  "Vidio": [V("Private 1 Bulan"), V("Sharing 1 Bulan")],
  "Canva Pro": [V("1 Bulan"), V("6 Bulan")],
  "Spotify": [V("Private 1 Bulan"), V("Sharing 1 Bulan")],
  "Disney": [V("Private 1 Bulan"), V("Sharing 1 Bulan")],
  "WeTV": [V("Private 1 Bulan"), V("Sharing 1 Bulan")],
  "YouTube Premium": [V("1 Bulan"), V("6 Bulan")],
  "IQIYI": [V("Premium 1 Bulan")],
  "Bstation": [V("Premium 1 Bulan")],
  "Loklok": [V("VIP 1 Bulan")],
  "Viu": [V("VIP 1 Bulan")],
  "DramaBox": [V("VIP 1 Bulan")],
  "Crunchyroll": [V("Premium 1 Bulan")],

  // AI & Tools
  "ChatGPT": [V("Plus 1 Bulan")],
  "Gemini": [V("Advanced 1 Bulan")],
  "Perplexity": [V("Pro 1 Bulan")],
  "Remini": [V("Premium 1 Bulan")],
  "Dazzcam": [V("Pro 1 Bulan")],
  "PicsArt": [V("Gold 1 Bulan")],
  "Alight Motion": [V("Pro 1 Bulan")],
  "Blackbox": [V("Developer Pro")],
  "CapCut Pro": [V("1 Bulan"), V("6 Bulan")],

  // Utility & Productivity
  "Microsoft 365": [V("Personal 1 Bulan"), V("Family 1 Bulan")],
  "Zoom Pro": [V("1 Bulan"), V("6 Bulan")],
  "GetContact": [V("Premium 1 Bulan")],
  "Jasa Pembuatan Website": [V("Landing Page"), V("E-Commerce"), V("Portfolio")],
  "VPN": [V("Premium 1 Bulan"), V("VPN")],

  // Sosmed
  "Instagram": [V("1000 Followers"), V("5000 Followers"), V("10.000 Followers")],
  "TikTok": [V("1000 Followers"), V("5000 Followers"), V("10.000 Followers")],
  "Wink": [V("VIP 1 Bulan")],
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

  console.log("✅ Seeding full catalog: DONE");
}

// =========================================================
// AUTH
// =========================================================
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

// =========================================================
// API PRODUK DAN VARIAN
// =========================================================
app.get("/api/products", async (req, res) => {
  let products = await db.all("SELECT * FROM products");
  if (products.length === 0) {
    console.log("⚠️ Produk kosong, seeding ulang...");
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

// =========================================================
// API PESANAN
// =========================================================
app.post("/api/orders", async (req, res) => {
  const { product_id, variant_id, name, contact, method, total } = req.body;
  const createdAt = new Date().toISOString();

  const result = await db.run(
    `INSERT INTO orders (product_id, variant_id, name, contact, method, total, createdAt)
     VALUES (?,?,?,?,?,?,?)`,
    [product_id, variant_id, name, contact, method, total, createdAt]
  );

  await db.run("UPDATE product_variants SET stock = stock - 1 WHERE id=?", [
    variant_id,
  ]);
  await db.run(
    `UPDATE products
     SET stock = (SELECT COALESCE(SUM(stock),0) FROM product_variants WHERE product_id=?)
     WHERE id=?`,
    [product_id, product_id]
  );

  res.json({ id: result.lastID, stockAdjusted: true });
});

app.get("/api/orders/:id", async (req, res) => {
  const row = await db.get(
    `SELECT o.*, p.name AS product_name, v.title AS variant_title, v.price AS variant_price
     FROM orders o
     LEFT JOIN products p ON o.product_id = p.id
     LEFT JOIN product_variants v ON o.variant_id = v.id
     WHERE o.id=?`,
    [req.params.id]
  );
  if (!row) return res.json({ error: "Order tidak ditemukan" });
  row.formattedId = "NV" + String(row.id).padStart(5, "0");
  res.json(row);
});

// =========================================================
// ADMIN API (PROTECTED)
// =========================================================
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
  const rows = await db.all(
    `SELECT o.*, p.name AS product_name, v.title AS variant_title
     FROM orders o
     LEFT JOIN products p ON p.id = o.product_id
     LEFT JOIN product_variants v ON v.id = o.variant_id
     ORDER BY o.id DESC`
  );
  res.json(rows);
});

app.post("/api/admin/orders/:id/status", verifyToken, async (req, res) => {
  await db.run("UPDATE orders SET status=? WHERE id=?", [
    req.body.status,
    req.params.id,
  ]);
  res.json({ success: true });
});

app.put("/api/admin/product/:id", verifyToken, async (req, res) => {
  const { name, category, image, stock, description } = req.body;
  await db.run(
    "UPDATE products SET name=?, category=?, image=?, stock=?, description=? WHERE id=?",
    [name, category, image, stock, description, req.params.id]
  );
  res.json({ success: true });
});

app.post("/api/admin/product/:id/variant", verifyToken, async (req, res) => {
  const { title, price } = req.body;
  await db.run(
    "INSERT INTO product_variants (product_id, title, price, stock) VALUES (?,?,?,10)",
    [req.params.id, title, price]
  );
  res.json({ success: true });
});

app.put("/api/admin/variant/:id", verifyToken, async (req, res) => {
  const { title, price, stock, description } = req.body;
  const variantId = req.params.id;
  await db.run(
    "UPDATE product_variants SET title=?, price=?, stock=?, description=? WHERE id=?",
    [title, price, stock, description, variantId]
  );
  const row = await db.get(
    "SELECT product_id FROM product_variants WHERE id=?",
    [variantId]
  );
  if (row) {
    await db.run(
      `UPDATE products
       SET stock = (SELECT COALESCE(SUM(stock),0) FROM product_variants WHERE product_id=?)
       WHERE id=?`,
      [row.product_id, row.product_id]
    );
  }
  res.json({ updated: true, stockSynced: true });
});

app.delete("/api/admin/variant/:id", verifyToken, async (req, res) => {
  await db.run("DELETE FROM product_variants WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

// =========================================================
// FRONTEND & HTTPS REDIRECT
// =========================================================
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.headers.host && req.headers.host.startsWith("www.")) {
    return res.redirect(301, "https://" + req.headers.host.slice(4) + req.url);
  }
  next();
});

app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server berjalan di PORT ${PORT}`));