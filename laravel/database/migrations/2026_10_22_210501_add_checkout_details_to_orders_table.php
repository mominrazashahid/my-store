<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Full checkout details: contact email, structured shipping + billing
 * addresses and order notes. The old free-text address/city columns are
 * folded into shipping_address.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('customer_email')->nullable()->after('customer_name');
            // {first_name, last_name, line1, line2, city, state, postal_code, country}
            $table->json('shipping_address')->nullable()->after('customer_phone');
            $table->json('billing_address')->nullable()->after('shipping_address');
            $table->text('notes')->nullable()->after('billing_address');
        });

        DB::table('orders')->orderBy('id')->each(function (object $order): void {
            $address = json_encode([
                'first_name' => $order->customer_name,
                'last_name' => '',
                'line1' => $order->customer_address,
                'line2' => null,
                'city' => $order->customer_city,
                'state' => null,
                'postal_code' => null,
                'country' => null,
            ]);
            DB::table('orders')->where('id', $order->id)
                ->update(['shipping_address' => $address, 'billing_address' => $address]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['customer_address', 'customer_city']);
        });
    }

    /**
     * Reverse the migrations. Structured address parts beyond line 1 and city are lost.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->text('customer_address')->nullable()->after('customer_phone');
            $table->string('customer_city', 100)->nullable()->after('customer_address');
        });

        DB::table('orders')->orderBy('id')->each(function (object $order): void {
            $address = json_decode((string) $order->shipping_address, true) ?? [];
            DB::table('orders')->where('id', $order->id)->update([
                'customer_address' => trim(($address['line1'] ?? '').' '.($address['line2'] ?? '')),
                'customer_city' => $address['city'] ?? '',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['customer_email', 'shipping_address', 'billing_address', 'notes']);
        });
    }
};
