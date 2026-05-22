# Contributing to FinTrack

First off, thank you for considering contributing to FinTrack! We appreciate your help in making this a better open-source personal finance tool.

## Where do I go from here?

If you notice a bug, have a feature request, or want to make an enhancement, please search the open issues first. If it doesn't exist, open a new issue describing your plan before writing code.

## Setting up your development environment

This project uses **Bun** as its package manager and runtime.

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/salauddinn/expense-manager-ai.git
   cd expense-manager-ai
   ```
3. Install dependencies:
   ```bash
   bun install
   ```
4. Set up your local Supabase instance or connect to a development project. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```
   Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`.

5. Start the development server:
   ```bash
   bun run dev
   ```

## Making Changes

- Create a new branch from `main` for your work.
- Make your changes! Ensure your code follows the style guidelines and TypeScript best practices.
- Run the linter and tests before committing:
   ```bash
   bun run lint
   bun run test
   ```

## Submitting a Pull Request

1. Commit your changes and push them to your fork.
2. Open a Pull Request from your branch to the main repository.
3. Fill out the Pull Request template provided. Be sure to describe what your PR does and any issues it closes.
4. Wait for a review! We'll do our best to review your PR as quickly as possible.

## License

By contributing to FinTrack, you agree that your contributions will be licensed under the MIT License.
