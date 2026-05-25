<?php

use App\Http\Controllers\Api\RouteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| UNIB Pathfinder — API Routes
|--------------------------------------------------------------------------
|
| GET  /api/nodes           → Ambil semua node kampus (untuk dropdown UI)
| POST /api/shortest-path   → Hitung rute terpendek dengan A*
|
*/

Route::prefix('v1')->group(function () {
    Route::get('nodes',          [RouteController::class, 'getNodes']);
    Route::post('shortest-path', [RouteController::class, 'getShortestPath']);
});

// Alias tanpa prefix versi (kompatibel dengan contoh di guide)
Route::get('nodes',          [RouteController::class, 'getNodes']);
Route::post('shortest-path', [RouteController::class, 'getShortestPath']);
