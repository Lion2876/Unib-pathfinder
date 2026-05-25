#!/bin/bash
# =============================================================
#  setup-backend.sh — Instalasi otomatis UNIB Pathfinder Backend
# =============================================================
# Jalankan SETELAH membuat project Laravel baru:
#   composer create-project laravel/laravel unib-backend
#   cd unib-backend
#   bash /path/to/setup-backend.sh
# =============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   UNIB Pathfinder — Backend Setup                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Salin file ke proyek Laravel ──────────────────────────────
echo "📁 Menyalin file ke proyek Laravel..."

cp "$SCRIPT_DIR/app/Models/CampusNode.php"                    app/Models/
cp "$SCRIPT_DIR/app/Models/CampusEdge.php"                    app/Models/
cp "$SCRIPT_DIR/app/Services/AStarService.php"                app/Services/ 2>/dev/null || mkdir -p app/Services && cp "$SCRIPT_DIR/app/Services/AStarService.php" app/Services/
cp "$SCRIPT_DIR/app/Http/Controllers/Api/RouteController.php" app/Http/Controllers/Api/ 2>/dev/null || mkdir -p app/Http/Controllers/Api && cp "$SCRIPT_DIR/app/Http/Controllers/Api/RouteController.php" app/Http/Controllers/Api/
cp "$SCRIPT_DIR/database/migrations/"*.php                    database/migrations/
cp "$SCRIPT_DIR/database/seeders/CampusGraphSeeder.php"       database/seeders/
cp "$SCRIPT_DIR/database/seeders/DatabaseSeeder.php"          database/seeders/
cp "$SCRIPT_DIR/routes/api.php"                               routes/api.php
cp "$SCRIPT_DIR/config/cors.php"                              config/cors.php

# ── Setup .env ────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    cp "$SCRIPT_DIR/.env.example" .env
    echo "⚙️  File .env dibuat dari .env.example"
    echo "   ⚠️  Sesuaikan DB_DATABASE, DB_USERNAME, DB_PASSWORD di .env"
fi

# ── Generate app key ──────────────────────────────────────────
echo "🔑 Generate app key..."
php artisan key:generate

# ── Jalankan migration & seeder ───────────────────────────────
echo ""
echo "🗄️  Menjalankan migration..."
php artisan migrate --force

echo "🌱 Menjalankan seeder..."
php artisan db:seed --force

echo ""
echo "✅ Backend siap!"
echo "   Jalankan server dengan: php artisan serve"
echo "   API tersedia di:        http://localhost:8000/api"
echo ""
echo "   Endpoint:"
echo "   GET  http://localhost:8000/api/nodes"
echo "   POST http://localhost:8000/api/shortest-path"
echo ""
