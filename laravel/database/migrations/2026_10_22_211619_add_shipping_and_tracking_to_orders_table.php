<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Orders now carry the chosen shipping method and its cost (total =
 * subtotal + shipping) and, once shipped, the carrier and tracking number.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // minor units of the store's currency
            $table->unsignedBigInteger('subtotal')->default(0)->after('notes');
            $table->unsignedInteger('shipping_cost')->default(0)->after('subtotal');
            $table->string('shipping_method', 100)->nullable()->after('shipping_cost');
            $table->string('carrier', 100)->nullable()->after('status');
            $table->string('tracking_number', 100)->nullable()->after('carrier');
            $table->timestamp('shipped_at')->nullable()->after('tracking_number');
        });

        // existing orders had no shipping charge
        DB::table('orders')->update(['subtotal' => DB::raw('total')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'shipping_cost', 'shipping_method', 'carrier', 'tracking_number', 'shipped_at']);
        });
    }
};
