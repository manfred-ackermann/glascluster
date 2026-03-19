# Agent Instructions and Codebase Guidelines

Welcome, autonomous agent. This document contains the critical rules, operational guidelines, and architectural standards for operating within this repository. You must read and strictly adhere to these rules before planning or executing any changes.

*Note: Since the directory was empty during initial analysis, this serves as a robust foundational template. The human operator should update the specific tech stack commands (e.g., swapping npm for cargo, pytest, etc.) as the project initializes.*

---

## 1. Core Mandates for Agents

1. **Do Not Guess:** Always verify assumptions using `grep`, `glob`, and `read`. If you need to know how a utility is implemented or what props a component takes, look it up.
2. **Mimic the Codebase:** Adopt the existing architectural patterns, formatting, and naming conventions. Your code should be indistinguishable from the rest of the project.
3. **Verify Everything:** Run tests, type-checkers, and linters after every substantial change. Do not conclude a task with a broken build.
4. **Be Proactive but Safe:** Fulfill the user's implicit needs (e.g., adding a test for a new feature), but do not undertake massive refactors or introduce new third-party dependencies without explicit permission.

---

## 2. Build, Lint, and Test Commands

Agents must always verify their work using the project's standard commands. Since this project is newly initialized, here are the standard patterns to use (update these based on the final stack):

### 2.1 Testing
- **Run all tests:** `npm run test` or `pytest`
- **Run a single test (Crucial for Agents):** 
  - *Node/Jest:* `npx jest path/to/file.test.ts -t "specific test name"`
  - *Python/Pytest:* `pytest path/to/test_file.py::test_specific_function`
  - *Go:* `go test ./path/to/pkg -run ^TestSpecificFunction$`
- **Run tests in watch mode:** `npm run test:watch`

**Agent Directive:** When modifying business logic, always locate the corresponding test file. Run the specific test targeting your change first. Once it passes, run the full test suite to ensure no regressions were introduced.

### 2.2 Linting & Formatting
- **Lint the codebase:** `npm run lint` or `ruff check .`
- **Auto-fix lint issues:** `npm run lint:fix` or `ruff check --fix .`
- **Format code:** `npm run format` (Prettier) or `black .`
- **Type checking:** `npm run typecheck` (e.g., `tsc --noEmit`) or `mypy .`

**Agent Directive:** Never consider a task complete if `lint` or `typecheck` commands fail. Resolve all warnings and errors you introduce.

### 2.3 Building & Running
- **Build project:** `npm run build` or `cargo build`
- **Start local development:** `npm run dev`

---

## 3. Code Style Guidelines

### 3.1 Architecture & File Structure
- **Single Responsibility:** Keep files small and focused on a single responsibility or domain concept.
- **Colocation:** Always co-locate tests with their implementation files (e.g., `UserService.ts` and `UserService.test.ts` side-by-side).
- **Feature Modules:** Group files by feature (e.g., `src/features/auth`) rather than strictly by type (e.g., avoiding monolithic `src/controllers` and `src/models` folders).

### 3.2 Typing & Type Safety
- **Strict Typing:** Never use `any` or `unknown` (in TS) unless absolutely unavoidable. In Python, use strict type hints for all function signatures.
- **Explicit Returns:** Define explicit return types for all public functions, exported utilities, and API boundaries.
- **Interfaces over Types:** In TypeScript, prefer `interface` over `type` aliases for object definitions to allow for declaration merging and better error messages.

### 3.3 Naming Conventions
- **Variables & Functions:** Use `camelCase` (e.g., `getUserData`, `calculateTotal`).
- **Classes, Types, & Interfaces:** Use `PascalCase` (e.g., `UserProfile`, `DatabaseConnection`).
- **Constants:** Use `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT_MS`).
- **Files:** Use `kebab-case.ts` for general utilities, and `PascalCase.tsx` (or `.ts` classes) for components or class files.
- **Clarity over Brevity:** Use highly descriptive names. Avoid obscure abbreviations. (`req`, `res`, `err` are acceptable standard abbreviations; `usr`, `dbConn`, `cb` are not).

### 3.4 Imports & Exports
- **Named Exports:** Use named exports instead of default exports to ensure consistent naming across the codebase and better refactoring support.
- **Import Ordering:** Group imports logically:
  1. Standard library / Framework core dependencies
  2. External third-party packages
  3. Internal path aliases (e.g., `@/components/...`)
  4. Relative imports (`../`, then `./`)
- **Circular Dependencies:** Be highly vigilant not to introduce circular dependencies when extracting code.

### 3.5 Error Handling
- **No Silent Failures:** Never swallow errors silently in empty `catch` blocks. Always log them appropriately or bubble them up.
- **Custom Errors:** Use custom error classes to distinguish between expected domain/application errors and unexpected system crashes.
- **Async Handling:** In async functions, prefer explicit `try/catch` blocks over `.catch()` Promise chains for better readability.
- **Sanitized Output:** Return meaningful error messages to the client, but never expose sensitive internal stack traces or database queries.

### 3.6 Formatting & Comments
- **Self-Documenting Code:** Write code that explains itself. Do not add comments explaining *what* the code does.
- **Contextual Comments:** Add comments explaining *why* a particular approach was taken, especially for complex algorithms, regexes, or weird business logic workarounds.
- **Docstrings:** Use standard JSDoc/Docstrings for all exported modules, classes, and complex functions to provide IDE hover context.
- **Tooling:** Always rely on the project's formatting tools (Prettier, Black, etc.) rather than manually tweaking spaces.

---

## 4. Git & Commit Guidelines

Agents must follow these rules when asked to commit code:
- **Atomic Commits:** Break down large changes into logical, atomic commits.
- **Commit Messages:** Follow the Conventional Commits specification:
  - `feat: add user registration flow`
  - `fix: resolve null pointer in checkout`
  - `refactor: extract token validation logic`
  - `test: add unit tests for auth guard`
- **Descriptive Bodies:** If the change is complex, include a commit body explaining the motivation and the "why" behind the change.
- **No Secrets:** Ensure `.env` files, credentials, or private keys are never added to the staging area.

---

## 5. Security & Safety Best Practices

- **Sanitize Input:** Always validate and sanitize data originating from user input, external APIs, or database reads before processing it.
- **Secure Dependencies:** Do not add undocumented or unverified third-party libraries.
- **Safe Execution:** Absolutely avoid using dynamic code execution like `eval()` or unsafely executing arbitrary shell commands based on user input.

---

## 6. Integration with Other AI Tools

When operating in this repository, agents must also check for and respect additional contextual rules provided by other integrated tools:
- **Cursor Rules:** Check for the existence of `.cursorrules` in the root directory or files within the `.cursor/rules/` directory. If they exist, merge their instructions with these guidelines.
- **GitHub Copilot:** Check for `.github/copilot-instructions.md`. If present, abide by its prompt directives when generating code.

---
*End of Agent Instructions. Proceed with caution, thoroughness, and excellence.*