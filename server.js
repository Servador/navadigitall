import express from "express";
import Database from "better-sqlite3";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

// Load ENV
dotenv.config();

// Fix dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Auto create db folder & db file
const dbFolder = path.join(__dirname, "db");
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const DB_FILE = path.join(dbFolder, "nava.db");
if (!fs.existsSync(DB_FILE)) {
  console.log("📌 Generating new SQLite DB file");
  fs.writeFileSync(DB_FILE, "");
}

const db = new Database(DB_FILE);
console.log("✅ Database Connected:", DB_FILE);
db.pragma("foreign_keys = ON");
// =========================================================
// 🧩 Pastikan tabel product_variants ada kolom "description"
// =========================================================
try {
  // Cek apakah tabel product_variants sudah ada
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='product_variants'").get();
  
  if (tables) {
    const columns = db.prepare("PRAGMA table_info(product_variants)").all();
    const hasDescription = columns.some(c => c.name === "description");
    if (!hasDescription) {
      console.log("🛠 Menambahkan kolom 'description' ke product_variants...");
      db.prepare("ALTER TABLE product_variants ADD COLUMN description TEXT DEFAULT ''").run();
      console.log("✅ Kolom 'description' berhasil ditambahkan!");
    } else {
      console.log("✅ Kolom 'description' sudah ada, skip alter table.");
    }
  } else {
    console.log("ℹ️ Tabel product_variants belum ada, akan dibuat nanti saat CREATE TABLE.");
  }
} catch (err) {
  console.error("❌ Gagal memastikan kolom description:", err.message);
}

db.exec(`
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

// ✅ SEED KOMPLIT: jalan hanya saat DB masih kosong
(function seedIfEmpty() {
  const row = db.prepare("SELECT COUNT(*) AS c FROM products").get();
  if (row.c > 0) return; // sudah ada data, jangan seed lagi

  console.log("⏳ Seeding full catalog...");

  // 1) Definisi produk
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
  { name: "Bstation", category: "Streaming", image: "img/bstation.png" },
  { name: "Loklok", category: "Streaming", image: "img/loklok.png" },

  // 🧠 AI & Tools
  { name: "ChatGPT", category: "AI Tools", image: "img/chatgpt.png" },
  { name: "Gemini", category: "AI Tools", image: "img/gemini.png" },
  { name: "Perplexity", category: "AI Tools", image: "img/perplexity.png" },
  { name: "Remini", category: "AI Tools", image: "img/remini.png" },
  { name: "Dazzcam", category: "AI Tools", image: "img/dazzcam.png" },
  { name: "PicsArt", category: "AI Tools", image: "img/picsart.png" },
  { name: "CapCut Pro", category: "Editing", image: "img/capcut.png" },
  { name: "Alight Motion", category: "Editing", image: "img/alight.png" },
  { name: "Blackbox", category: "AI Tools", image: "img/blackbox.png" },

  // 🌐 Layanan & Tools
  { name: "Microsoft 365", category: "Productivity", image: "img/microsoft.png" },
  { name: "Zoom Pro", category: "Productivity", image: "img/zoom.png" },
  { name: "GetContact", category: "Utility", image: "img/getcontact.png" },
  { name: "Nokos", category: "Utility", image: "img/nokos.png" },
  { name: "Panel", category: "Utility", image: "img/panel.png" },
  { name: "Script", category: "Utility", image: "img/script.png" },
  { name: "Jasa Pembuatan Website", category: "Utility", image: "img/website.png" },

  // 💬 Sosmed & Komunitas
  { name: "Instagram", category: "Sosmed", image: "img/ig.png" },
  { name: "TikTok", category: "Sosmed", image: "img/tiktok.png" },
  { name: "Wink", category: "Sosmed", image: "img/wink.png" },

  // 🎮 Game
  { name: "Panel Game", category: "Game", image: "img/gamepanel.png" },
  { name: "Crunchyroll", category: "Streaming", image: "img/crunchy.png" },
  { name: "DramaBox", category: "Streaming", image: "img/dramabox.png" },
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
  "Nokos": [V("Nomor Sementara"), V("Nomor Permanen")],
  "Panel": [V("Paket 1"), V("Paket 2"), V("Paket 3")],
  "Script": [V("Basic"), V("Full Version")],
  "Jasa Pembuatan Website": [V("Landing Page"), V("E-Commerce"), V("Portfolio")],

  // Sosmed
  "Instagram": [V("1000 Followers"), V("5000 Followers"), V("10.000 Followers")],
  "TikTok": [V("1000 Followers"), V("5000 Followers"), V("10.000 Followers")],
  "Wink": [V("VIP 1 Bulan")],

  // Game
  "Panel Game": [V("1 Bulan"), V("3 Bulan")],
};

  // 3) Insert dalam transaksi (cepat & atomic)
  const insertProduct = db.prepare(
    "INSERT INTO products (name, category, image, stock) VALUES (?,?,?,0)"
  );
  const insertVariant = db.prepare(
    "INSERT INTO product_variants (product_id, title, price, stock) VALUES (?,?,?,?)"
  );
  const syncProduct = db.prepare(`
    UPDATE products
    SET stock = (
      SELECT COALESCE(SUM(stock),0)
      FROM product_variants
      WHERE product_id = ?
    )
    WHERE id = ?
  `);

  const tx = db.transaction(() => {
    for (const p of products) {
      const res = insertProduct.run(p.name, p.category, p.image);
      const pid = res.lastInsertRowid;

      // varian untuk produk tsb (jika tidak ada, biarkan kosong)
      (variants[p.name] || []).forEach(v =>
        insertVariant.run(pid, v.title, v.price, v.stock)
      );

      // hitung & set total stok
      syncProduct.run(pid, pid);
    }
  });

  tx();
  console.log("✅ Seeding full catalog: DONE");
})();

// ===== AUTH =====
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
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Email/Password salah" });
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

// ✅ Get Products with Variants
app.get("/api/products", (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();

  const result = products.map(p => {
    const variants = db.prepare(`
      SELECT id, title, price, stock, description
      FROM product_variants
      WHERE product_id = ?
    `).all(p.id);
    const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    return { ...p, stock: totalStock, variants };
  });

  res.json(result);
});

// Replace endpoint POST /api/orders menjadi ini:
app.post("/api/orders", (req, res) => {
  const { product_id, variant_id, name, contact, method, total } = req.body;
  const createdAt = new Date().toISOString();

  // Buat order
  const q = db.prepare(`
    INSERT INTO orders (product_id, variant_id, name, contact, method, total, createdAt)
    VALUES (?,?,?,?,?,?,?)
  `);

  const result = q.run(product_id, variant_id, name, contact, method, total, createdAt);

  // Kurangi stok varian -1
  db.prepare(`
    UPDATE product_variants SET stock = stock - 1 WHERE id = ?
  `).run(variant_id);

  // Sync stok produk total
  db.prepare(`
    UPDATE products
    SET stock = (
      SELECT COALESCE(SUM(stock), 0)
      FROM product_variants WHERE product_id = ?
    )
    WHERE id = ?
  `).run(product_id, product_id);

  res.json({ id: result.lastInsertRowid, stockAdjusted: true });
});


// ✅ GET DETAIL ORDER BY ID
app.get("/api/orders/:id", (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT o.*, 
      p.name AS product_name,
      v.title AS variant_title,
      v.price AS variant_price
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN product_variants v ON o.variant_id = v.id
    WHERE o.id = ?
  `;

  const row = db.prepare(sql).get(id);

  if (!row) {
    return res.json({ error: "Order tidak ditemukan" });
  }

  row.formattedId = "NV" + String(row.id).padStart(5, "0");

  res.json(row);
});

// ✅ Web UI Route
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= ADMIN API =================

// ✅ Ambil semua produk + varian (PROTECTED)
app.get("/api/admin/products", verifyToken, (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();

  const result = products.map(p => {
    const variants = db.prepare(`
      SELECT id, title, price, stock, description
      FROM product_variants
      WHERE product_id = ?
    `).all(p.id);
    const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    return { ...p, stock: totalStock, variants };
  });

  res.json(result);
});

// ✅ Ambil semua pesanan (PROTECTED)
app.get("/api/admin/orders", verifyToken, (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, p.name AS product_name, v.title AS variant_title
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    LEFT JOIN product_variants v ON v.id = o.variant_id
    ORDER BY o.id DESC
  `).all();
  res.json(rows);
});

// ✅ Update Status Pesanan
app.post("/api/admin/orders/:id/status", verifyToken, (req, res) => {
  const { status } = req.body;
  db.prepare("UPDATE orders SET status=? WHERE id=?")
    .run(status, req.params.id);
  res.json({ success: true });
});

// ✅ Update produk (pastikan sesuai)
app.put("/api/admin/product/:id", verifyToken, (req, res) => {
  const { name, category, image, stock, description } = req.body;
  db.prepare(`
    UPDATE products SET name=?, category=?, image=?, stock=?, description=?
    WHERE id=?
  `).run(name, category, image, stock, description, req.params.id);
  res.json({ success: true });
});

// ✅ Tambah varian
app.post("/api/admin/product/:id/variant", verifyToken, (req, res) => {
  const { title, price } = req.body;
  db.prepare(`
    INSERT INTO product_variants (product_id, title, price, stock)
    VALUES (?,?,?,10)
  `).run(req.params.id, title, price);
  res.json({ success: true });
});

// ✅ Hapus varian
app.delete("/api/admin/variant/:id", verifyToken, (req, res) => {
  db.prepare("DELETE FROM product_variants WHERE id=?")
    .run(req.params.id);
  res.json({ success: true });
});

app.put("/api/admin/variant/:id", verifyToken, (req, res) => {
  const { title, price, stock } = req.body;
  const variantId = req.params.id;

  // Update varian
  db.prepare(
    "UPDATE product_variants SET title=?, price=?, stock=? WHERE id=?"
  ).run(title, price, stock, variantId);

  // Ambil product_id terkait
  const row = db.prepare(
    "SELECT product_id FROM product_variants WHERE id=?"
  ).get(variantId);

  if (row) {
    // Sync ulang stok total produk
    db.prepare(`
      UPDATE products
      SET stock = (
        SELECT COALESCE(SUM(stock), 0)
        FROM product_variants
        WHERE product_id = ?
      )
      WHERE id = ?
    `).run(row.product_id, row.product_id);
  }

  res.json({ updated: true, stockSynced: true });
});

// ✅ Run Server
// ✅ Serve Frontend Files
app.use(express.static(path.join(__dirname, "public")));

// Redirect www ke non-www
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

// ✅ Redirect unknown routes ke index.html (untuk domain root)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server berjalan di PORT ${PORT}`));
