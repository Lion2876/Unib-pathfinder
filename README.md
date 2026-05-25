# 🗺️ UNIB Pathfinder — Sistem Rute Terpendek Kampus UNIB
## Implementasi Algoritma A\* dengan Dynamic Heuristics
**Proyek UAS · Mata Kuliah Artificial Intelligence**

---

## 📁 Struktur Proyek

```
unib-pathfinder/
├── backend/                    ← File-file kustom untuk Laravel
│   ├── app/
│   │   ├── Models/
│   │   │   ├── CampusNode.php
│   │   │   └── CampusEdge.php
│   │   ├── Services/
│   │   │   └── AStarService.php  ← INTI algoritma A*
│   │   └── Http/Controllers/Api/
│   │       └── RouteController.php
│   ├── database/
│   │   ├── migrations/           ← Schema tabel
│   │   └── seeders/              ← Data graf kampus UNIB
│   ├── routes/
│   │   └── api.php
│   ├── config/
│   │   └── cors.php
│   ├── .env.example
│   └── setup-backend.sh         ← Script instalasi otomatis
│
└── frontend/                   ← Proyek React (Vite) lengkap
    ├── src/
    │   ├── App.jsx               ← Komponen utama + UI sidebar
    │   ├── main.jsx
    │   ├── index.css
    │   ├── components/
    │   │   └── CampusMap.jsx     ← Peta Leaflet + Polyline rute
    │   └── hooks/
    │       └── useCampusRoute.js ← Logic API call & state
    ├── index.html
    ├── package.json
    ├── vite.config.js            ← Proxy /api → localhost:8000
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env
    └── setup-frontend.sh        ← Script instalasi otomatis
```

---

## ⚡ Cara Menjalankan (Step by Step)

### Prasyarat
- PHP >= 8.1
- Composer
- Node.js >= 18
- MySQL / MariaDB
- Git

---

### LANGKAH 1 — Setup Backend Laravel

```bash
# 1. Buat proyek Laravel baru
composer create-project laravel/laravel unib-backend
cd unib-backend

# 2. Buat database di MySQL (nama bebas, sesuaikan .env)
mysql -u root -p -e "CREATE DATABASE unib_pathfinder;"

# 3. Salin file dari folder backend/ ke proyek Laravel
#    (lakukan satu per satu atau gunakan script di bawah)

cp /path/to/unib-pathfinder/backend/app/Models/CampusNode.php              app/Models/
cp /path/to/unib-pathfinder/backend/app/Models/CampusEdge.php              app/Models/

mkdir -p app/Services
cp /path/to/unib-pathfinder/backend/app/Services/AStarService.php          app/Services/

mkdir -p app/Http/Controllers/Api
cp /path/to/unib-pathfinder/backend/app/Http/Controllers/Api/RouteController.php  app/Http/Controllers/Api/

cp /path/to/unib-pathfinder/backend/database/migrations/*.php              database/migrations/
cp /path/to/unib-pathfinder/backend/database/seeders/CampusGraphSeeder.php database/seeders/
cp /path/to/unib-pathfinder/backend/database/seeders/DatabaseSeeder.php    database/seeders/

cp /path/to/unib-pathfinder/backend/routes/api.php                         routes/api.php
cp /path/to/unib-pathfinder/backend/config/cors.php                        config/cors.php

# 4. Setup .env
cp .env.example .env
# Edit .env: sesuaikan DB_DATABASE, DB_USERNAME, DB_PASSWORD
# Tambahkan: FRONTEND_URL=http://localhost:5173

# 5. Generate key & jalankan migration + seeder
php artisan key:generate
php artisan migrate
php artisan db:seed

# 6. Jalankan server
php artisan serve
# → Server berjalan di http://localhost:8000
```

---

### LANGKAH 2 — Setup Frontend React

```bash
# Dari direktori frontend/ yang sudah ada di zip ini:
cd /path/to/unib-pathfinder/frontend

# Install dependensi
npm install

# Jalankan development server
npm run dev
# → Aplikasi berjalan di http://localhost:5173
```

---

## 🧪 Cara Test & Demonstrasi

### Test API Manual (tanpa frontend)
```bash
# GET semua node
curl http://localhost:8000/api/nodes

# POST cari rute normal (luar jam sibuk)
curl -X POST http://localhost:8000/api/shortest-path \
  -H "Content-Type: application/json" \
  -d '{"start":"GATE_UTAMA","end":"FKIP","time":"10:00"}'

# POST cari rute saat jam sibuk — hasilnya berbeda!
curl -X POST http://localhost:8000/api/shortest-path \
  -H "Content-Type: application/json" \
  -d '{"start":"GATE_UTAMA","end":"FKIP","time":"12:30"}'
```

### Skenario Demonstrasi Dynamic Heuristics
| Waktu  | Status     | Rute yang Dipilih A\*         | Alasan                      |
|--------|------------|-------------------------------|-----------------------------|
| 10:00  | Normal     | via Kantin Pusat (450m)       | Jalur terpendek             |
| 12:30  | JAM SIBUK  | via Perpustakaan→Simpang B (630m) | Kantin terlalu padat (peak_weight 3.5×) |
| 08:00  | JAM SIBUK  | via Rektorat alternatif       | Rute masuk kuliah pagi      |

---

## 🧠 Cara Kerja Algoritma A\*

```
f(n) = g(n) + h(n)

g(n) = Σ (distance_meters × effective_weight) ← DINAMIS berdasarkan waktu
h(n) = Haversine distance ke tujuan           ← Estimasi tetap (admissible)

Saat JAM SIBUK:   effective_weight = peak_weight  (bisa 3.5×)
Saat NORMAL:      effective_weight = base_weight  (1.0)
```

**Efek:** Jalur via Kantin (80m × 3.5 = 280 unit) terasa lebih "mahal" daripada
jalur alternatif yang lebih panjang tapi sepi (160m × 1.4 = 224 unit).
A\* otomatis memilih rute yang lebih hemat biaya efektif.

---

## 🔧 Konfigurasi Tambahan

### Menambah Node Baru
Edit `CampusGraphSeeder.php` di bagian array `$nodeData`, tambahkan:
```php
['code' => 'KODE_BARU', 'name' => 'Nama Gedung', 'lat' => -3.XXXXX, 'lng' => 102.XXXXX, 'type' => 'building'],
```
Lalu jalankan: `php artisan db:seed --class=CampusGraphSeeder`

### Mengubah Jam Sibuk
Edit array `$peakHours` di `AStarService.php`.

### Deploy Production
```bash
# Frontend
npm run build   # output ke dist/

# Backend
php artisan config:cache
php artisan route:cache
```

---

## 📌 API Reference

### `GET /api/nodes`
Respons: array semua node kampus
```json
[{ "id": 1, "code": "GATE_UTAMA", "name": "Gerbang Utama UNIB", "latitude": -3.75802, "longitude": 102.27098, "type": "gate" }]
```

### `POST /api/shortest-path`
Body:
```json
{ "start": "GATE_UTAMA", "end": "FKIP", "time": "12:30" }
```
Respons:
```json
{
  "success": true,
  "path": [{ "id": 1, "code": "GATE_UTAMA", "name": "...", "latitude": -3.758, "longitude": 102.271 }],
  "total_nodes": 5,
  "distance_meters": 630,
  "is_peak_hour": true,
  "peak_info": "Jam sibuk aktif — bobot jalur padat ditingkatkan..."
}
```

---

*Dibuat untuk Proyek UAS Mata Kuliah Artificial Intelligence · Universitas Bengkulu*
