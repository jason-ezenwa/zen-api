# Zen API

A comprehensive fintech API built with TypeScript, Express, and MongoDB that provides secure financial services including multi-currency wallets, currency exchange, and virtual card management.

## Features

- **Authentication & Authorization** - JWT-based secure user authentication
- **Multi-Currency Wallets** - Support for USD, NGN, GHS, and KES currencies
- **Currency Exchange** - Real-time FX quotes with Redis caching
- **Virtual Cards** - VISA virtual card creation and management
- **Payment Processing** - Paystack integration for deposits and payments
- **Webhook Handling** - Secure webhook processing for external services

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with routing-controllers
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for FX quotes and session management
- **Authentication**: JWT tokens
- **Validation**: class-validator with DTOs
- **Testing**: Jest with comprehensive unit tests
- **Dependency Injection**: TypeDI container
- **Payment Gateway**: Paystack
- **Card Provider**: Maplerad

## Architecture

The API follows a clean, modular architecture with:

- **Domain-Driven Design** - Organized by business domains (auth, wallets, cards, etc.)
- **Dependency Injection** - Loose coupling with TypeDI
- **Service Layer Pattern** - Business logic separated from controllers
- **DTO Validation** - Type-safe request/response handling
- **Centralized Error Handling** - Custom error classes with proper HTTP status codes

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Redis server
- Maplerad account for card services
- Paystack account for payments

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jason-ezenwa/zen-api.git
cd zen-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Run database migrations:
```bash
npm run migrate-db
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run migrate-db` - Run database migrations
- `npm run create-db-migration` - Create new migration

## Testing

The project includes comprehensive unit tests with Jest:

```bash
npm test
```

Tests cover:
- Authentication service logic
- Wallet operations and funding
- Currency exchange functionality
- Virtual card management
- Error handling scenarios

## Deployment

The API is deployed and accessible at: https://zen-api-68zd.onrender.com

### Production Deployment

1. Build the project:
```bash
npm run build
```

2. Set production environment variables

3. Run migrations and start:
```bash
npm start
```

## Security Features

- **Input Validation** - All endpoints use DTOs with class-validator
- **Authentication** - JWT-based with proper token verification
- **Authorization** - Route-level access control
- **IP Whitelisting** - Webhook endpoints verify source IP addresses
- **Error Handling** - Secure error responses without sensitive data exposure
- **CORS** - Configured for cross-origin requests

## Supported Currencies

- **USD** - US Dollar
- **NGN** - Nigerian Naira  
- **GHS** - Ghanaian Cedi
- **KES** - Kenyan Shilling

## Virtual Card Brands

- **VISA**

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Contact

For questions or support, contact me via email @chukwuemelie.ezenwa@gmail.com 