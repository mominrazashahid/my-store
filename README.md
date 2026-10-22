# my-store

A free online store builder with a shared marketplace. Sellers create a store,
add products and set where they ship; shoppers browse every store from one
marketplace, add items from several stores to one cart and check out once
(one order per store).

## Stack

Laravel 13 + Inertia.js v3 (React 19, TypeScript) + MySQL, in [`laravel/`](laravel/).

## Run locally

Requires PHP 8.4+, Composer, Node 20+ and MySQL.

```bash
cd laravel
composer install
npm install
cp .env.example .env
php artisan key:generate

# create the MySQL database named in .env (my_store by default), then:
php artisan migrate --seed       # tables + demo stores
php artisan storage:link         # serve uploaded images
php artisan demo:product-images  # optional: stock photos for demo products

npm run build                    # or `npm run dev` while working on the frontend
php artisan serve                # http://127.0.0.1:8000
```

Demo store owner login: `demo@my-store.test` / `demo1234` at `/admin`.

## Tests

```bash
cd laravel && php artisan test
```

## Notes

- Cash on delivery is available for Pakistan shipping addresses only; other
  countries need card payment (Stripe Connect, not built yet).
- Prices are stored in the minor unit of each store's currency (cents, paisa).
