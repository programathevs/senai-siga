<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $existing = collect(Schema::getIndexes('personal_access_tokens'))->pluck('name')->all();

            if (!in_array('personal_access_tokens_tokenable_type_tokenable_id_index', $existing)) {
                $table->index(['tokenable_type', 'tokenable_id']);
            }

            if (!in_array('personal_access_tokens_tokenable_id_index', $existing)) {
                $table->index('tokenable_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $existing = collect(Schema::getIndexes('personal_access_tokens'))->pluck('name')->all();

            if (in_array('personal_access_tokens_tokenable_id_index', $existing)) {
                $table->dropIndex('personal_access_tokens_tokenable_id_index');
            }
        });
    }
};
