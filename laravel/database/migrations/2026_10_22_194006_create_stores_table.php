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
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users');
            $table->string('name');
            // tenant key in the URL: <subdomain>.platform.pk
            $table->string('subdomain', 63)->unique();
            $table->string('store_type', 20);
            // references a theme defined in frontend code, not the DB
            $table->string('theme_id', 50);
            $table->string('plan', 20)->default('free');
            $table->string('status', 20)->default('active');
            $table->boolean('show_in_marketplace')->default(true);
            $table->string('contact_phone', 30)->nullable();
            $table->string('contact_email')->nullable();
            // {line, city, mapUrl}
            $table->json('address')->nullable();
            // {currency, whatsapp, socialLinks: {facebook, instagram, tiktok}}
            $table->json('settings')->nullable();
            $table->timestamps();

            // marketplace feed: active stores that opted in
            $table->index(['status', 'show_in_marketplace']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
