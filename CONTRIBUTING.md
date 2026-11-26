# Contributing

Thanks for helping out. Bug reports, fixes and new features are all welcome.

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree on
  the approach before you spend time on it.
- Set up the project by following [Getting started](README.md#getting-started).

## Making a change

1. Fork the repository and create a branch from `master`.
2. Make your change in `laravel/`. Keep to the style of the code around it.
3. Add or update tests for what you changed.
4. Check that everything passes:

   ```bash
   cd laravel
   php artisan test
   vendor/bin/pint --test   # PHP code style
   npm run build            # TypeScript and the frontend build
   ```

5. Open a pull request that explains what changed and why.

## Guidelines

- Store money as integers in the currency's smallest unit (cents, paisa).
- Validate input with Form Requests, and scope seller data to the store the
  user owns.
- Use icons from `lucide-react` in the UI, not emojis.
- Don't commit `.env` files, API keys or other secrets.

## License

By contributing, you agree that your contributions are licensed under the
[GNU AGPL-3.0](LICENSE), the same license as the project.
