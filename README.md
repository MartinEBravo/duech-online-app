# DUECh en linea - Dictionary of Chilean Spanish

Web application for the Dictionary of Chilean Spanish Usage (DUECh).

## Documentation

This project includes comprehensive TypeDoc documentation. To generate and view the documentation:

```bash
npm run docs
```

The documentation will be generated in the `docs` folder and opened in your default web browser.

## Description

This web application allows exploring and searching words from Chilean Spanish, including chileanisms, idioms, and expressions typical of the country. The project provides both a public dictionary interface and an authenticated editor workspace for lexicographers.

## Features

### Public Interface

- **Quick search**: Search words by lemma or content in definitions (`/buscar`)
- **Word of the day**: Discover a random word every time you visit the main page
- **Advanced search**: Filter by grammatical categories, usage styles, origin, dictionaries, and initial letter
- **Detailed visualization**: Explore complete definitions with examples, variants, and related expressions

### Editor Workspace

- **Editor dashboard**: Manage dictionary entries through `/editor/buscar` with additional filters (status, assigned lexicographer)
- **Inline editing**: Edit word entries directly in the detail page (`/palabra/[lemma]`) with auto-save
- **User management**: Admin interface for managing lexicographer accounts (`/usuarios`)
- **Redacted words**: Track and export redacted word reports (`/redactadas`)
- **Editorial comments**: Collaborative commenting system on word entries

## Technologies

- **Next.js 15.5** with App Router
- **React 19** for UI components
- **TypeScript 5** for static typing
- **TailwindCSS v4** for styling
- **Drizzle ORM** with PostgreSQL
- **React Email** for transactional emails
- **ESLint and Prettier** for code quality
- **Vitest** for testing
- **TypeDoc** for documentation generation

## Installation

1. Make sure you have Node.js 18+ installed

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (copy `.env.example` to `.env` and configure)

4. Run database migrations if needed

## Running the Application

### Development mode

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production mode

```bash
npm run build
npm run start
```

## Project Structure

```
duech-online-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Home page with word of the day
│   │   ├── buscar/             # Public search page
│   │   ├── palabra/[lemma]/    # Word detail page (public & editor)
│   │   ├── login/              # Authentication
│   │   ├── cambiar-contrasena/ # Password change
│   │   ├── usuarios/           # User management (admin)
│   │   ├── redactadas/         # Redacted words report
│   │   ├── recursos/           # Resources page
│   │   ├── acerca/             # About page
│   │   └── api/                # API routes
│   │       ├── auth/           # Authentication endpoints
│   │       ├── search/         # Search API
│   │       ├── users/          # User management API
│   │       └── words/          # Words CRUD API
│   │
│   ├── components/             # React components
│   │   ├── common/             # Shared UI components
│   │   │   ├── alert.tsx       # Alert notifications
│   │   │   ├── button.tsx      # Button component
│   │   │   ├── chip.tsx        # Tag/chip components
│   │   │   ├── dropdown.tsx    # Select dropdowns
│   │   │   ├── modal.tsx       # Modal dialog
│   │   │   └── ...
│   │   ├── search/             # Search-related components
│   │   │   ├── search-bar.tsx  # Search input with filters
│   │   │   ├── search-page.tsx # Main search page
│   │   │   ├── word-card.tsx   # Search result card
│   │   │   └── pagination.tsx  # Pagination controls
│   │   ├── word/               # Word display/editing
│   │   │   ├── word-page.tsx   # Main word display
│   │   │   ├── word-header.tsx # Word header with metadata
│   │   │   ├── word-definition.tsx # Definition section
│   │   │   ├── inline-editable.tsx # Inline edit component
│   │   │   └── comment/        # Editorial comments
│   │   ├── users/              # User management components
│   │   ├── emails/             # Email templates
│   │   ├── auth/               # Authentication components
│   │   └── redacted-words/     # Redacted words components
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useDebounce.ts      # Debounce hook
│   │   ├── useSearchState.ts   # Search state management
│   │   ├── useUrlSearchParams.ts # URL params parsing
│   │   └── useUserRole.ts      # User role utilities
│   │
│   ├── lib/                    # Core utilities
│   │   ├── db.ts               # Database connection
│   │   ├── schema.ts           # Drizzle schema definitions
│   │   ├── queries.ts          # Database queries
│   │   ├── definitions.ts      # TypeScript type definitions
│   │   ├── auth.ts             # Authentication logic
│   │   ├── actions.ts          # Server actions
│   │   ├── cookies.ts          # Cookie management
│   │   ├── email.ts            # Email sending utilities
│   │   └── ...
│   │
│   ├── middleware.ts           # Next.js middleware (auth, routing)
│   └── __tests__/              # Test files
│
├── docs/                       # Generated TypeDoc documentation
└── public/                     # Static assets
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### Search

- `GET /api/search` - Search dictionary entries

### Words

- `GET /api/words/[lemma]` - Get word by lemma
- `PUT /api/words/[lemma]` - Update word (editor)
- `DELETE /api/words/[lemma]` - Delete word (admin)
- `POST /api/words` - Create new word (editor)
- `GET /api/words/redacted` - Get redacted words report
- `POST /api/words/redacted/send-email` - Send redacted words report

### Users

- `GET /api/users` - List all users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/[id]` - Update user (admin)
- `DELETE /api/users/[id]` - Delete user (admin)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run docs` - Generate and open TypeDoc documentation
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test` - Run tests with Vitest
- `npm run deps:check` - Check for unused dependencies (knip)
- `npm run duplication` - Check for code duplication (jscpd)
- `npm run full` - Run all checks (format, lint, deps, duplication, build)

## Authentication & Authorization

The application uses session-based authentication with role-based access control:

- **Public users**: Can search and view published words
- **Lexicographers**: Can edit assigned words, add comments
- **Admins**: Can manage users, assign words, change word status
- **Superadmins**: Full access to all features

Editor mode is determined by the user's session. Filter state for editor searches is persisted in the `duech_editor_filters` cookie.

## Contributing

This is an MVP in active development. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is in development as part of an effort to digitize Chilean linguistic heritage.
