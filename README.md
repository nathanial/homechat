# HomeChat - Realtime Family Chat Application

A modern, realtime chat application built for family communication using TypeScript, React 19, Node.js, and Socket.io.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Zustand, @emotion/css
- **Backend**: Node.js, Express, TypeScript, Socket.io, SQLite
- **Shared**: TypeScript types, Zod validation schemas
- **Architecture**: npm workspaces monorepo

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Update the JWT_SECRET with a secure value.

### Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- Frontend at http://localhost:5173
- Backend at http://localhost:3000

### Building for Production

```bash
npm run build
```

## Project Structure

```
homechat/
├── packages/
│   ├── frontend/    # React application
│   ├── backend/     # Node.js server
│   └── shared/      # Shared types and utilities
└── scripts/         # Development scripts
```

## Features

- User authentication (register/login)
- Realtime messaging
- Family chat rooms
- Message history
- Online/offline status
- Typing indicators (coming soon)

## Development Commands

- `npm run dev` - Start development servers
- `npm run build` - Build all packages
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types

## Contributing

This is a family project, but suggestions are welcome!

## License

Private project - not for redistribution