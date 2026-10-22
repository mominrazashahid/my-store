<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_credentials_log_in_and_redirect_to_dashboard(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.com', 'password' => 'secret123']);

        $response = $this->post('/admin/login', ['email' => 'Owner@Example.com', 'password' => 'secret123']);

        $response->assertRedirect('/admin/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_wrong_password_is_rejected(): void
    {
        User::factory()->create(['email' => 'owner@example.com', 'password' => 'secret123']);

        $response = $this->post('/admin/login', ['email' => 'owner@example.com', 'password' => 'wrong']);

        $response->assertSessionHasErrors(['email' => 'Invalid email or password.']);
        $this->assertGuest();
    }

    public function test_locks_out_after_five_failed_attempts(): void
    {
        User::factory()->create(['email' => 'owner@example.com', 'password' => 'secret123']);

        foreach (range(1, 5) as $attempt) {
            $this->post('/admin/login', ['email' => 'owner@example.com', 'password' => 'wrong']);
        }
        $response = $this->post('/admin/login', ['email' => 'owner@example.com', 'password' => 'secret123']);

        $response->assertSessionHasErrors('email');
        $this->assertStringStartsWith('Too many login attempts.', session('errors')->first('email'));
        $this->assertGuest();
    }

    public function test_logout_ends_the_session(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->post('/logout');

        $response->assertRedirect('/admin');
        $this->assertGuest();
    }
}
