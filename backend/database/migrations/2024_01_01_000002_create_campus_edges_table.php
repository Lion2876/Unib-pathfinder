<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campus_edges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('node_from_id')->constrained('campus_nodes')->cascadeOnDelete();
            $table->foreignId('node_to_id')->constrained('campus_nodes')->cascadeOnDelete();

            // ─── Bobot Statis ───────────────────────────────────────────
            $table->float('distance_meters');   // Jarak fisik jalur (meter)
            $table->json('path_coordinates')->nullable(); // Koordinat jalan melengkung riil

            // ─── Parameter Dynamic Heuristics ──────────────────────────
            // base_weight : pengali biaya di luar jam sibuk  (1.0 = normal)
            // peak_weight : pengali biaya saat jam sibuk     (> 1.0 = lebih berat)
            // Biaya efektif = distance_meters × weight
            $table->float('base_weight')->default(1.0);
            $table->float('peak_weight')->default(2.5);

            // congestion_zone: potensi kepadatan jalur
            // 'low'    = jarang dilalui (jalur belakang, area GOR)
            // 'medium' = normal
            // 'high'   = area kantin, parkiran utama — sangat padat saat jam makan
            $table->enum('congestion_zone', ['low', 'medium', 'high'])->default('low');

            $table->boolean('is_bidirectional')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campus_edges');
    }
};
