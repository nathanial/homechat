# HomeChat - Realtime Family Chat Application

## Project Overview

HomeChat is a realtime chat application designed for family use. Built with TypeScript throughout, it features a React frontend powered by Vite and a Node.js backend, utilizing Socket.io for realtime communication.

## Architecture & Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: @emotion/css
- **Realtime**: Socket.io Client
- **UI Components**: Custom components with potential for component library integration

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Realtime**: Socket.io
- **Database**: SQLite (no ORM, direct SQL queries)
- **Authentication**: JWT tokens with refresh token rotation
- **File Storage**: Local filesystem (upgradeable to S3)

### Shared
- **Type Definitions**: Shared TypeScript interfaces and types
- **Validation**: Zod schemas used by both frontend and backend
- **Constants**: Shared configuration and constants

## Project Structure

```
homechat/
├── package.json                 # Root workspace configuration
├── tsconfig.json               # Root TypeScript configuration
├── .gitignore
├── README.md
├── PROJECT_PLAN.md
├── packages/
│   ├── frontend/               # React application
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── contexts/
│   │   │   └── utils/
│   │   └── public/
│   ├── backend/                # Node.js server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── database/
│   │   │   └── utils/
│   │   └── dist/
│   └── shared/                 # Shared types and utilities
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── types/
│       │   ├── schemas/
│       │   └── constants/
│       └── dist/
└── scripts/                    # Development and deployment scripts
```

## Core Features

### Phase 1 - MVP
1. **User Authentication**
   - Registration with email/username
   - Login/logout functionality
   - Session management

2. **Realtime Messaging**
   - Text messages
   - Message delivery status (sent, delivered, read)
   - Typing indicators
   - Online/offline status

3. **Chat Rooms**
   - Family group chat (main room)
   - Direct messages between family members
   - Room member list

4. **Message History**
   - Persistent message storage
   - Load previous messages on scroll
   - Search functionality

### Phase 2 - Enhancements
1. **Rich Media**
   - Image sharing
   - File attachments
   - Link previews

2. **Notifications**
   - Browser notifications
   - Unread message counts
   - @mentions

3. **User Experience**
   - Message reactions/emojis
   - Message editing
   - Message deletion
   - Reply to specific messages

### Phase 3 - Advanced Features
1. **Voice/Video Calls** (using WebRTC)
2. **Message Encryption**
3. **Mobile App** (React Native)
4. **Themes and Customization**

## Shared Types/Interfaces

```typescript
// shared/src/types/user.ts
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

// shared/src/types/message.ts
export interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  createdAt: Date;
  updatedAt?: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
}

// shared/src/types/room.ts
export interface Room {
  id: string;
  name: string;
  type: 'group' | 'direct';
  members: string[];
  createdAt: Date;
  lastMessage?: Message;
}
```

## Implementation Steps

### Step 1: Project Setup ✅
1. Initialize npm workspace ✅
2. Create package directories ✅
3. Configure TypeScript at root and package levels ✅
4. Set up ESLint and Prettier ✅
5. Initialize Git repository

### Step 2: Shared Package ✅
1. Define TypeScript interfaces ✅
2. Create Zod validation schemas ✅
3. Define Socket.io event names and payloads ✅
4. Set up package exports ✅

### Step 3: Backend Foundation ✅
1. Set up Express server with TypeScript ✅
2. Configure Socket.io server ✅
3. Set up database (SQLite - direct SQL) ✅
4. Implement authentication system ✅
5. Create REST API endpoints (Auth complete, others stubbed) ✅
6. Implement Socket.io event handlers (Basic setup) ✅

### Step 4: Frontend Foundation ✅
1. Initialize Vite + React + TypeScript ✅
2. Set up routing (React Router) ✅
3. Create authentication with Zustand ✅
4. Implement Socket.io client connection (Ready to implement)
5. Build core UI components (Login page complete, Chat page started) ✅

### Step 5: Core Chat Features
1. Implement message sending/receiving
2. Add typing indicators
3. Create chat room UI
4. Implement message history
5. Add online/offline status

### Step 6: Testing & Deployment
1. Add unit tests (Jest/Vitest)
2. Add integration tests
3. Set up CI/CD pipeline
4. Configure production deployment

## Development Workflow

### Scripts (Root package.json)
```json
{
  "scripts": {
    "dev": "npm run dev --workspaces",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "eslint packages/*/src --ext .ts,.tsx",
    "format": "prettier --write packages/*/src"
  }
}
```

### Environment Variables
- `.env.development` - Development configuration
- `.env.production` - Production configuration
- Never commit sensitive data

### Git Workflow
1. Feature branches from `main`
2. Conventional commits
3. PR reviews before merging
4. Automated testing on PR

## Security Considerations

1. **Authentication**: JWT with secure httpOnly cookies
2. **Input Validation**: Validate all inputs using Zod
3. **Rate Limiting**: Implement rate limiting for API and Socket.io
4. **CORS**: Configure CORS properly
5. **Environment Variables**: Use for sensitive configuration
6. **HTTPS**: Enforce HTTPS in production
7. **Content Security Policy**: Implement CSP headers

## Performance Optimizations

1. **Message Pagination**: Load messages in chunks
2. **Debounced Typing Indicators**: Reduce socket events
3. **Image Optimization**: Compress and resize uploads
4. **Connection Management**: Implement reconnection logic
5. **Caching**: Cache user data and recent messages

## Future Enhancements

1. **Internationalization**: Multi-language support
2. **Accessibility**: ARIA labels and keyboard navigation
3. **PWA**: Progressive Web App capabilities
4. **Analytics**: Usage tracking (privacy-respecting)
5. **Backup/Export**: Data export functionality
6. **Admin Panel**: User management interface

## Getting Started

After setup, the development workflow will be:

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

Frontend will be available at `http://localhost:5173`
Backend will be available at `http://localhost:3000`

## Success Metrics

1. **Performance**: Messages delivered in <100ms
2. **Reliability**: 99.9% uptime
3. **User Experience**: Intuitive UI, minimal learning curve
4. **Security**: No data breaches, secure communications
5. **Scalability**: Handle 50+ concurrent family members