<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestWith;
use Tests\TestCase;

class SignupControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PAYLOAD = [
        'name' => 'Ali Raza',
        'email' => 'Ali@Example.com',
        'password' => 'secret123',
        'storeType' => 'clothing',
        'storeName' => 'Ali Fashion',
        'subdomain' => 'ali-fashion',
        'currency' => 'PKR',
    ];

    public function test_creates_account_and_store_logs_in_and_redirects_to_the_store(): void
    {
        $response = $this->post('/signup', self::PAYLOAD);

        $response->assertRedirect('/store/ali-fashion');
        $user = User::sole();
        $this->assertAuthenticatedAs($user);
        $this->assertSame('ali@example.com', $user->email);
        $store = $user->stores()->sole();
        $this->assertSame('Ali Fashion', $store->name);
        $this->assertTrue($store->pages()->where('slug', 'home')->exists());
        $this->assertSame(4, $store->products()->count());
        $this->assertSame('PKR', $store->currency()->value);
        // $22 cotton tunic sample -> Rs 6,160 in paisa
        $this->assertSame(616000, $store->products()->where('title', 'Cotton Tunic')->value('price'));
        $this->assertSame('glow', $store->theme_id);
        $this->assertNotNull($store->themeConfig);
    }

    public function test_rejects_taken_subdomain_without_creating_the_account(): void
    {
        Store::factory()->create(['subdomain' => 'ali-fashion']);

        $response = $this->post('/signup', self::PAYLOAD);

        $response->assertSessionHasErrors(['subdomain' => 'That store address is taken — try another.']);
        $this->assertGuest();
        $this->assertFalse(User::where('email', 'ali@example.com')->exists());
    }

    public function test_rejects_already_registered_email_in_any_case(): void
    {
        User::factory()->create(['email' => 'ali@example.com']);

        $response = $this->post('/signup', self::PAYLOAD);

        $response->assertSessionHasErrors(['email' => 'That email is already registered — log in instead.']);
    }

    #[TestWith(['admin'])]
    #[TestWith(['-shop'])]
    #[TestWith(['my_shop'])]
    public function test_rejects_reserved_or_malformed_subdomain(string $subdomain): void
    {
        $response = $this->post('/signup', [...self::PAYLOAD, 'subdomain' => $subdomain]);

        $response->assertSessionHasErrors('subdomain');
        $this->assertSame(0, Store::count());
    }

    public function test_rejects_unsupported_currency(): void
    {
        $response = $this->post('/signup', [...self::PAYLOAD, 'currency' => 'XYZ']);

        $response->assertSessionHasErrors(['currency' => 'That currency isn’t supported yet.']);
        $this->assertSame(0, Store::count());
    }

    public function test_rejects_short_password(): void
    {
        $response = $this->post('/signup', [...self::PAYLOAD, 'password' => '12345']);

        $response->assertSessionHasErrors(['password' => 'Password must be at least 6 characters.']);
    }

    public function test_logged_in_owner_is_redirected_away_from_signup(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/signup')
            ->assertRedirect('/admin/dashboard');
    }
}
