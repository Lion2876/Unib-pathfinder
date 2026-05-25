<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campus_nodes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();       // Kode unik: "REKTORAT", "FKIP", dll.
            $table->string('name');                  // Nama tampilan lengkap
            $table->decimal('latitude', 10, 7);      // Koordinat GPS: lintang
            $table->decimal('longitude', 10, 7);     // Koordinat GPS: bujur
            $table->enum('type', ['building', 'junction', 'gate'])->default('building');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campus_nodes');
    }
};
