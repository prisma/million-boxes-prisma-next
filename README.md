# Million Boxes - Prisma Next Demo

A high-performance streaming demo application that showcases Prisma Next's capabilities by rendering one million colorful boxes. This project demonstrates efficient database operations, streaming responses, and real-time data visualization using Bun, [Prisma Next](https://www.prisma.io/blog/the-next-evolution-of-prisma-orm), and PostgreSQL.

## 📋 Description

This application creates and manages a database of 1 million color boxes, each with a unique algorithmically-generated color. It features:

- **Database seeding** of 1 million records in batches
- **Streaming API** for efficient data transfer
- **Interactive visualization** displaying boxes in real-time
- **Performance benchmarking** capabilities
- Built with **Bun** runtime for maximum performance
- Uses **Prisma Next** for type-safe database operations

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh/) (v1.0 or higher)
- [Node.js](https://nodejs.org/) (v18 or higher)
- Access to a PostgreSQL database (local or remote)

## 🚀 Getting Started

Follow these steps to get the project up and running:

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd million-boxes-prisma-next

# Install dependencies
bun install
```

### 2. Set Up Your Database

You have two options for setting up a PostgreSQL database:

#### Option A: Create a New Database (Recommended)

```bash
bunx create-db
```

This will create a new PostgreSQL database and provide you with a connection URL.

#### Option B: Use an Existing Database

If you already have a PostgreSQL database, skip the above step.

### 3. Configure Environment Variables

Create a `.env` file in the project root and add your database connection URL:

```bash
# Copy the DATABASE_URL from the previous step
echo "DATABASE_URL=postgresql://user:password@host:port/database" > .env
```

**Example:**

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/million_boxes
```

### 4. Initialize the Database Schema

Run the following command to initialize your database with the required schema:

```bash
bun run db:init
```

This command will:

- Emit the Prisma Next contract
- Create the necessary database tables

### 5. Seed the Database

Populate your database with 1 million colorful boxes:

```bash
bun run seed
```

**Note:** This process creates 1,000,000 records in batches of 10,000. It may take a few minutes depending on your system and database performance. You'll see progress updates in the console.

### 6. Start the Development Server

Launch the application:

```bash
bun run dev
```

The server will start on `http://localhost:3002` (or the port specified in your `PORT` environment variable).

## 🎯 Usage

Once the server is running, you can:

### View the Interactive Demo

Open your browser and navigate to:

```
http://localhost:3002
```

This will display an interactive visualization of the million boxes with their unique colors.

### API Endpoints

The application exposes the following endpoints:

#### 1. **Streaming API** (Recommended for large datasets)

```
GET /api/stream?limit=1000000
```

Streams box colors line-by-line for efficient memory usage.

#### 2. **Fetch API** (For smaller datasets)

```
GET /api/fetch?limit=1000
```

Returns all colors at once (use smaller limits to avoid memory issues).

**Query Parameters:**

- `limit` (optional): Number of boxes to retrieve (default: 1,000,000, max: 1,000,000)

## 📜 Available Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `bun run db:emit` | Generate Prisma Next contract            |
| `bun run db:init` | Initialize database schema               |
| `bun run db:push` | Push schema changes to database          |
| `bun run seed`    | Seed database with 1 million boxes       |
| `bun run bench`   | Run performance benchmarks               |
| `bun run dev`     | Start development server with hot reload |
| `bun run start`   | Start production server                  |

## 🏗️ Project Structure

```
million-boxes-prisma-next/
├── src/
│   ├── prisma-next/       # Prisma Next configuration and contracts
│   │   ├── contract.ts    # Database schema definition
│   │   ├── contract.json  # Generated contract
│   │   └── db.ts          # Database client setup
│   ├── bench.ts           # Performance benchmarking script
│   ├── seed.ts            # Database seeding script
│   ├── server.ts          # HTTP server and API endpoints
│   └── index.html         # Frontend visualization
├── prisma-next.config.ts  # Prisma Next configuration
├── package.json           # Project dependencies
├── .env                   # Environment variables (create this)
└── README.md              # This file
```

## 🔍 Troubleshooting

### Database Connection Issues

If you encounter connection errors:

1. Verify your `DATABASE_URL` in `.env` is correct
2. Ensure PostgreSQL is running
3. Check that the database exists and is accessible

### Seeding Takes Too Long

The seeding process is designed to handle 1 million records. If it's too slow:

- Reduce the `TOTAL` constant in `src/seed.ts`
- Increase the `BATCH` size (with caution)
- Ensure your database has adequate resources

### Port Already in Use

If port 3002 is already in use, set a different port in your `.env`:

```
PORT=3003
```

## 🛠️ Technology Stack

- **Runtime:** [Bun](https://bun.sh/) - Fast JavaScript runtime
- **ORM:** [Prisma Next](https://github.com/prisma/prisma-next)
- **Database:** PostgreSQL
- **Language:** TypeScript

This project is for demonstration purposes.

## 🤝 Contributing

This is a demo project. Feel free to fork and experiment!
