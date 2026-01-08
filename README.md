# Task Manager Application

A modern, enterprise-grade task management application built with React, TypeScript, and Vite. Features priority-based task organization, multiple lists, calendar view, and local persistence.

## Features

- **Priority-based Tasks**: Organize tasks by High, Medium, and Low priority
- **Multiple Lists**: Create and manage multiple task lists with color coding
- **Calendar View**: Visualize tasks by due date in a monthly calendar
- **Due Date Tracking**: Set due dates with time and get overdue warnings
- **Sort Options**: Sort by priority, date added, or alphabetically
- **Compact Mode**: Toggle between normal and compact view
- **Local Persistence**: All data automatically saved to browser localStorage
- **Toast Notifications**: Visual feedback for all user actions
- **Accessibility**: ARIA labels and keyboard navigation support

## Prerequisites

- Node.js 18+ and npm

## Installation

```bash
# Clone the repository
git clone https://github.com/meetpradeepp/autogen.git
cd autogen

# Install dependencies
npm install
```

## Development

```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## Architecture

This application follows enterprise software engineering principles:

- **State Management**: React Context + useReducer pattern (see ADR-001)
- **Zero External Dependencies**: Uses native browser APIs for date handling (see ADR-004)
- **Type Safety**: Strict TypeScript with no `any` types
- **Testing**: Unit tests with Vitest and React Testing Library
- **Code Quality**: Follows guidelines in `.github/copilot-instructions.md`

## Documentation

- **Architecture Decision Records (ADRs)**: See `docs/adr/` directory
  - ADR-001: Task Manager State Management
  - ADR-002: Multi-list Architecture
  - ADR-003: Toast Notification System
  - ADR-004: Date Handling for Due Dates

## Project Structure

```
autogen/
├── src/
│   ├── context/           # React Context providers
│   ├── modules/todo/      # Task management components
│   ├── test/              # Test setup and utilities
│   └── App.tsx            # Root component
├── docs/adr/              # Architecture Decision Records
├── .github/               # GitHub configuration and Copilot instructions
└── package.json           # Project dependencies and scripts
```

## Browser Support

- Modern browsers with ES2020+ support
- localStorage API required for persistence
- Intl.DateTimeFormat API for date formatting

## License

ISC
