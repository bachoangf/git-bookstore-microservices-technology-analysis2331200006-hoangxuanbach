# Frontend Application

React-based frontend application for the bookstore microservices system.

## Overview

The frontend is a single-page application (SPA) built with React that provides a user interface for:
- User authentication (login/register)
- Product management (view, create)
- Order management (create, view)
- Real-time notifications via Server-Sent Events (SSE)

## Technology Stack

- **React 18** - UI framework with hooks
- **Vite** - Build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **REST API** - Data fetching via API Gateway

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── AuthModal.jsx    # Login/register modal
│   │   ├── Header.jsx       # Navigation header
│   │   ├── ProductList.jsx  # Product listing
│   │   ├── ProductCard.jsx  # Individual product card
│   │   ├── ProductForm.jsx  # Product creation form
│   │   ├── OrderList.jsx    # Order listing
│   │   ├── OrderCard.jsx    # Individual order card
│   │   ├── OrderForm.jsx    # Order creation form
│   │   ├── WelcomeMessage.jsx  # Landing page message
│   │   ├── ErrorMessage.jsx # Error display component
│   │   └── LoadingSpinner.jsx # Loading indicator
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js       # Authentication logic
│   │   ├── useData.js       # Products and orders data fetching
│   │   ├── useProducts.js   # Product management
│   │   ├── useOrders.js     # Order management
│   │   └── useNotifications.js  # Real-time notifications
│   ├── utils/               # Utility functions
│   │   ├── api.js           # API client functions
│   │   └── constants.js     # Constants
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
└── package.json             # Dependencies
```

## Features

### Authentication
- User registration
- User login
- JWT token management
- Protected routes

### Product Management
- View all products in a grid layout
- Create new products
- Prefill order form from product card

### Order Management
- Create orders with product selection
- View order history
- Order status tracking

### Real-time Notifications
- Server-Sent Events (SSE) connection
- Real-time notification delivery
- Notification badge with unseen count
- Mark notifications as seen

## API Integration

The frontend communicates with the API Gateway at `http://localhost:8000`:

### Endpoints Used
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `GET /api/users/me` - Get current user
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/events` - SSE stream
- `POST /api/notifications/seen` - Mark as seen

## Development

### Prerequisites
- Node.js 18+ and npm

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The Vite development server runs on `http://localhost:5173` by default (see `vite.config.js`).

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The preview server (Vite) serves the production build at `http://localhost:4173` by default.

## Environment Variables

- `API_BASE`: Base URL for API Gateway (default: `http://localhost:8000`)

## State Management

The application uses React hooks for state management:
- **useAuth**: Manages authentication state and JWT tokens
- **useData**: Manages products and orders data (fetches via REST API)
- **useProducts**: Handles product form state and creation
- **useOrders**: Handles order form state and creation
- **useNotifications**: Manages notification state and SSE connection

## Real-time Features

### Server-Sent Events (SSE)
The application streams SSE notifications using the Fetch API so that it can include the `Authorization` header required by the API Gateway:

```javascript
const response = await fetch(`${API_BASE}/api/notifications/events`, {
  headers: { Authorization: `Bearer ${token}` }
});

const reader = response.body.getReader();
// parse incoming SSE frames from the reader (see useNotifications hook)
```

Event types emitted by the Notification Service:
- `connected`: Initial connection confirmation
- `notification`: Payload includes `{ notification: {...} }`
- `heartbeat`: Keep-alive message every 30 seconds

## Styling

The application uses TailwindCSS for styling:
- Responsive design (mobile-first)
- Dark theme with gradient backgrounds
- Modern UI components with rounded corners and shadows
- Consistent color scheme (slate grays, emerald accents)

## Component Architecture

### Main Components
- **App**: Root component, orchestrates all features
- **Header**: Navigation and user info
- **ProductList**: Displays products in a grid
- **ProductCard**: Individual product card component
- **ProductForm**: Form for creating products
- **OrderForm**: Form for creating orders
- **OrderList**: Displays orders
- **OrderCard**: Individual order card component
- **AuthModal**: Login/register modal
- **WelcomeMessage**: Landing page for unauthenticated users
- **ErrorMessage**: Displays error messages to users
- **LoadingSpinner**: Loading indicator component

### Custom Hooks
- **useAuth**: Authentication and token management
- **useData**: Data fetching with REST API
- **useProducts**: Product form and creation
- **useOrders**: Order form and creation
- **useNotifications**: SSE connection and notifications

## Error Handling

- Global error messages displayed via `ErrorMessage` component
- Form validation with user-friendly error messages
- Network error handling with retry logic
- Authentication error handling (token expiration)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features required
- SSE support required for notifications

## Docker

The frontend is containerized and runs on port 3000. It's proxied through the API Gateway at port 8000.

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

