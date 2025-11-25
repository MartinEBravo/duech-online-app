# DUECh en línea - Dictionary of Chilean Spanish

Web application for the Dictionary of Chilean Spanish Usage (DUECh).

## Documentation

This web application has an automatic documentation system using TypeDoc. To generate and view the documentation, run:

```bash
npm run docs
```

The documentation will be generated in the `docs` folder and opened in your default web browser.

## Description

This web application allows exploring and searching words from Chilean Spanish, including chileanisms, idioms, and expressions typical of the country. The project is designed with a modular architecture to facilitate future integration with Neo4j.

The platform now ships with two experiences:

- **Public dictionary** under `/buscar` and `/ver/[id]`
- **Editor workspace** under `/editor/buscar` and `/editor/editar/[id]` (rewritten automatically when visiting `http://editor.localhost:3000`)

## Features

- **Quick search**: Search words by lemma or content in definitions (`/buscar`)
- **Word lottery**: Discover a random word every time you visit the main page
- **Advanced search**: Filter by grammatical categories, usage styles, origin, and initial letter
- **Editor tools**: Manage dictionary entries through the `/editor/buscar` dashboard with additional filters (status, assigned lexicographer) and `/editor/editar/[id]` detail pages
- **Detailed visualization**: Explore complete definitions with examples, variants, and related expressions
- **Responsive design**: Interface optimized for mobile and desktop devices

## Technologies

- **Next.js 15** with App Router and Turbopack
- **React 19** for UI components
- **TypeScript** for static typing
- **TailwindCSS v4** for styling
- **ESLint and Prettier** for code quality
- **React Markdown** for content rendering

## Installation

1. Make sure you have Node.js 18+ installed

2. Install dependencies:

```bash
npm install
```

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
├── app/                     # Pages and routes (App Router)
│   ├── (public)/           # Public dictionary experience
│   │   ├── page.tsx        # Home page
│   │   ├── buscar/page.tsx # Public search results
│   │   └── ver/[id]/page.tsx # Public word detail
│   ├── editor/             # Authenticated editor workspace
│   │   ├── page.tsx        # Redirect to /editor/buscar
│   │   ├── buscar/page.tsx # Editor search with extra filters
│   │   └── editar/[id]/    # Editor detail editing UI
│   ├── api/                # API routes
│   │   ├── metadata/       # Metadata API endpoint
│   │   ├── search/         # Search API endpoints
│   │   └── words/          # Words API endpoints
│   ├── recursos/           # Resources page
│   └── acerca/             # About page
├── app/ui/                 # Reusable UI components
│   ├── search-bar.tsx      # Search bar component
│   ├── word-of-the-day.tsx # Random word component
│   └── markdown-renderer.tsx # Markdown rendering component
├── lib/                    # Utilities and business logic
│   ├── db.ts              # Database connection (Drizzle ORM)
│   ├── schema.ts          # Database schema definitions
│   ├── queries.ts         # Database query functions
│   ├── transformers.ts    # DB to frontend format transformers
│   └── definitions.ts     # TypeScript type definitions
└── public/                 # Static assets
    └── [various SVG icons and images]
```

## Data

The application currently uses the `example.json` file from the `duech-online-parsing` repository as its data source. This file contains a sample of dictionary entries with their complete structure.

## API Endpoints

The application includes several API endpoints:

- `/api/search` - Basic text search
- `/api/search/advanced` - Advanced search with filters
- `/api/words/[lemma]` - Get specific word by lemma
- `/api/metadata` - Get dictionary metadata

> **Tip:** To access the editor interface via subdomain, add `127.0.0.1 editor.localhost` to your hosts file and visit `http://editor.localhost:3000`. Middleware rewrites the request to `/editor/buscar`.

## Future Development

- Integration with Neo4j database for semantic relationships
- REST API for programmatic access
- User contribution system
- Word relationship visualizations
- Data export in different formats

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build application for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Authentication

All dictionary features are available without authentication. The previous cookie-based login flow has been removed so the application can be explored freely.

The editor search persists filter state in the `duech_editor_filters` cookie for convenience.

## Contributing

This is an MVP in active development. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is in development as part of an effort to digitize Chilean linguistic heritage.
