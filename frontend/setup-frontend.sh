#!/bin/bash
# =============================================================
#  setup-frontend.sh — Instalasi otomatis React Frontend
# =============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   UNIB Pathfinder — Frontend Setup                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📦 Menginstall dependensi npm..."
npm install

echo ""
echo "✅ Frontend siap!"
echo "   Jalankan dev server dengan: npm run dev"
echo "   Akses di:                   http://localhost:5173"
echo ""
echo "   ⚠️  Pastikan Laravel berjalan di http://localhost:8000"
echo "   sebelum menggunakan aplikasi ini."
echo ""
