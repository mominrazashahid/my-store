# my-store

An open-source online store builder with a shared marketplace.

Sellers sign up, create a store, add products and choose where they ship.
Shoppers browse products from every store in one marketplace, add items from
several stores to a single cart and check out once. Each store gets its own
order.

## Features

**For shoppers**
- Marketplace home page with products from all stores
- A page for each store, and a page for each product
- One cart across stores, with one checkout that creates an order per store
- Pick your country; you only see shipping options that reach you

**For sellers** (admin area at `/admin`)
- Products: title, description, images, price, compare-at price and stock
- Orders: move them through their statuses and add the carrier and tracking number
- Shipping: zones (groups of countries) with their own rates
- Appearance: edit the store's navbar links and hero section, with image upload
- Settings: store name, contact details, address, and whether the store
  appears in the marketplace

**Not built yet**
- Card payments. Checkout is cash on delivery only for now, and only for
  shipping addresses in Pakistan (`config/store.php` → `cod_countries`).
- Paid plans. Free stores are capped at 20 products (`FREE_PLAN_PRODUCT_LIMIT`).

## Tech stack

- [Laravel 13](https://laravel.com) (PHP 8.3+)
- [Inertia.js v3](https://inertiajs.com) with React 19 and TypeScript, built with Vite
- MySQL (SQLite is used for the test suite)
- Icons from [lucide-react](https://lucide.dev)

All application code lives in [`laravel/`](laravel/).

## Getting started

You need PHP 8.3+, Composer, Node 20+ and MySQL 8.

```bash
git clone https://github.com/mominrazashahid/my-store.git
cd my-store/laravel

composer install
npm install
cp .env.example .env
php artisan key:generate
```

Create a MySQL database (the default name in `.env` is `my_store`) and set
`DB_USERNAME` / `DB_PASSWORD` in `.env`. Then:

```bash
php artisan migrate --seed       # create the tables and some demo stores
php artisan storage:link         # serve uploaded images
php artisan demo:product-images  # optional: add stock photos to the demo products

npm run build                    # or `npm run dev` while working on the frontend
php artisan serve                # http://127.0.0.1:8000
```

Log in as the demo store owner at `/admin` with `demo@my-store.test` / `demo1234`.

## Running the tests

```bash
cd laravel
php artisan test
```

Tests use an in-memory SQLite database, so they don't touch your MySQL data.

## Project layout

```
laravel/
  app/Http/Controllers/        marketplace, storefront, cart, checkout
  app/Http/Controllers/Admin/  seller admin (products, orders, shipping, ...)
  app/Support/Cart.php         the session cart shared across stores
  database/migrations/         schema
  database/seeders/            demo stores and products
  resources/js/pages/          React pages rendered by Inertia
  routes/web.php               all routes
```

## How a few things work

- **Prices** are stored as integers in the smallest unit of the store's
  currency (cents, paisa), never as floats.
- **Store admin URLs** (`/admin/stores/{store}/...`) only resolve to stores the
  logged-in user owns, and products, orders and shipping zones are looked up
  within that store.
- **Shopper country** is kept in a cookie and defaults to worldwide.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).
To report a security problem, see [SECURITY.md](SECURITY.md) instead of
opening a public issue.

## License

[GNU AGPL-3.0](LICENSE). You can use, change and host this software. If you
run a modified version for other people over a network (for example as a
website), you must make your modified source code available to those users
under the same license.
