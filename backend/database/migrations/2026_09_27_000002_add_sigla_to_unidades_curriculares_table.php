<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('unidades_curriculares', function (Blueprint $table) {
            $table->string('sigla', 20)->nullable()->after('nome');
        });
    }

    public function down(): void
    {
        Schema::table('unidades_curriculares', function (Blueprint $table) {
            $table->dropColumn('sigla');
        });
    }
};
