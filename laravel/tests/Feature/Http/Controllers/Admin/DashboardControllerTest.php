<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/admin/dashboard')->assertRedirect('/admin');
    }

    public function test_redirects_owner_to_their_first_stores_products(): void
    {
        $owner = User::factory()->create();
        $first = Store::factory()->for($owner, 'owner')->create();
        Store::factory()->for($owner, 'owner')->create();

        $this->actingAs($owner)->get('/admin/dashboard')
            ->assertRedirect("/admin/stores/{$first->id}/products");
    }

    public function test_owner_without_a_store_sees_the_empty_dashboard(): void
    {
        $this->actingAs(User::factory()->create())->get('/admin/dashboard')
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard'));
    }
}
