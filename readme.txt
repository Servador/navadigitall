──────────────────────────────────────────────
NAVA DIGITAL STORE v6 — FULLSTACK SECURE EDITION
──────────────────────────────────────────────

📦 STRUCTURE:
nava-minimal-store-v6/
├─ server.js
├─ package.json
├─ .env
├─ db/
│  └─ nava.db   ← dibuat otomatis
└─ public/
   ├─ index.html
   ├─ checkout.html
   ├─ success.html
   ├─ login.html
   ├─ admin.html
   ├─ style.css
   ├─ app.js
   └─ img/
      └─ qris-navadigital.png (QRIS simple + “NAVA DIGITAL SHOP”)

──────────────────────────────────────────────
💻 INSTALASI & CARA MENJALANKAN:
──────────────────────────────────────────────
1️⃣ Buka folder ini di VS Code
2️⃣ Jalankan terminal:
    npm install
3️⃣ Jalankan server:
    npm start
4️⃣ Buka di browser:
    http://localhost:3000

──────────────────────────────────────────────
🔐 LOGIN ADMIN:
──────────────────────────────────────────────
Email: admin@nava.digital
Password: @adminnavadigi20

──────────────────────────────────────────────
📊 FITUR UTAMA:
──────────────────────────────────────────────
✅ Frontend responsif (2 produk di HP, 4 di PC)
✅ QRIS pembayaran (simple, hitam-putih)
✅ Checkout → tampilkan QRIS + “NAVA DIGITAL SHOP”
✅ Invoice + konfirmasi WhatsApp otomatis
✅ Admin login aman (JWT + dotenv)
✅ CRUD harga produk dari admin panel
✅ Daftar pesanan tersimpan di SQLite
✅ Semua tombol dan popup berfungsi penuh

──────────────────────────────────────────────
⚙️ TEKNOLOGI:
──────────────────────────────────────────────
- Node.js + Express
- SQLite3
- bcrypt + JWT
- dotenv + body-parser + cors

──────────────────────────────────────────────
🧠 CATATAN:
──────────────────────────────────────────────
- Data disimpan di `db/nava.db`
- Jika database belum ada, dibuat otomatis
- QRIS demo dapat diganti dengan file lain di:
  public/img/qris-navadigital.png
- Pastikan port `3000` tidak dipakai aplikasi lain

──────────────────────────────────────────────
📞 KONTAK ADMIN:
──────────────────────────────────────────────
WhatsApp: 0821-2983-7460
──────────────────────────────────────────────

© 2025 NAVA DIGITAL SHOP — All Rights Reserved
