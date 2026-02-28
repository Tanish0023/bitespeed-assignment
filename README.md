# Bitespeed Identity Service

A simple REST API that identifies and links contacts together based on email and phone number.

## What Does It Do?

This service helps you identify unique contacts. When you send an email or phone number, it:

- Creates a new contact if it doesn't exist
- Links related contacts together (primary and secondary)
- Returns all linked contact information

## Project Structure

```
bitespeed-assignment/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app.ts            # Express app setup
│   ├── server.ts         # Server entry point
│   ├── config/
│   │   └── prisma.ts     # Prisma client
│   ├── controllers/
│   │   └── identify.controller.ts   # Request handler
│   ├── routes/
│   │   └── identify.route.ts        # API route
│   ├── services/
│   │   └── identity.service.ts      # Business logic
│   └── validators/
│       └── identify.validator.ts    # Input validation
├── package.json
└── tsconfig.json
```

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **TypeScript** - Type safety
- **Zod** - Input validation

## How to Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Make sure you have PostgreSQL installed. Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/bitespeed"
PORT=3000
```

Replace `username`, `password` with your PostgreSQL credentials.

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Create Database Tables

```bash
npx prisma db push
```

## How to Run

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm run start
```

The server will start at `http://localhost:3000`

## API Testing (Postman)

A Postman collection is included in the `/postman` folder.

Steps to test:

1. Import the collection and environment into Postman.
2. Update the `base_url` variable in the environment with the deployed API URL.
3. Run any request from the collection.

All requests are preconfigured to demonstrate different identity reconciliation scenarios.

## How to Use the API

### Endpoint

```
POST /identify
```

### Request Body

Send JSON with at least one of email or phoneNumber:

```json
{
  "email": "john@example.com",
  "phoneNumber": "1234567890"
}
```

### Example Response

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["john@example.com", "jane@example.com"],
    "phoneNumbers": ["1234567890", "9876543210"],
    "secondaryContactIds": [2, 3]
  }
}
```

### Test with cURL

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'
```

## How It Works

1. **Request comes in** - Controller validates the input using Zod
2. **Find existing contacts** - Service checks if email or phone number already exists
3. **Create or Link** - If new, creates a contact; if exists, links to primary contact
4. **Return result** - Returns all linked contacts with primary and secondary IDs

## License

MIT
