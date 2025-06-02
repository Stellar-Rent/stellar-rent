# 🚀 StellarRent Backend

Backend API for StellarRent, built with Express, TypeScript and Supabase.

## 📋 Prerequisites

- **Node.js** (v18+)
- **Bun** (install with `curl -fsSL https://bun.sh/install | bash`)
- **Docker & Docker Compose** (for containerized development)
- **Supabase account** and project created

## 🛠️ Complete Setup

### 1. Install Dependencies
```bash
cd apps/backend
bun install
```

### 2. 🗄️ Database Setup
**IMPORTANT**: Configure the database BEFORE continuing.

1. Go to your Supabase dashboard
2. Open the **SQL Editor**
3. Execute the complete script: [`database/setup.sql`](./database/setup.sql)

📖 **Detailed guide**: [`database/README.md`](./database/README.md)

### 3. Environment Variables
Create `.env` in `apps/backend/`:

```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_super_secure_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

> 💡 **Tip**: Find your keys in Supabase → Settings → API

### 4. Run Server

**Option A: Local Development**
```bash
bun run dev
```

**Option B: Docker Development (Recommended)**
```bash
# Start with Docker Compose
docker-compose up

# Or in background
docker-compose up -d
```

API running at **http://localhost:3000** 🎉

## 🐳 Docker Development

We provide a **simple and clean Docker setup** for development:

### Quick Start
```bash
# Build and start the container
docker-compose up

# Run in background
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend
```

### Health Check
```bash
# Test if the API is running
curl http://localhost:3000/health
# Expected: {"status":"healthy","timestamp":"...","uptime":...}

# Test main endpoint
curl http://localhost:3000/
# Expected: {"message":"Stellar Rent API is running successfully 🚀"}
```

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start development environment |
| `docker-compose up -d` | Start in background |
| `docker-compose down` | Stop and remove containers |
| `docker-compose logs backend` | View backend logs |
| `docker-compose restart backend` | Restart backend service |
| `docker build -t stellarrent-backend .` | Build image manually |

### Docker Features
- ✅ **Hot reload**: Code changes automatically restart the server
- ✅ **Health check**: Built-in `/health` endpoint monitoring
- ✅ **Volume mounting**: Local changes sync with container
- ✅ **Simple setup**: Uses Bun for fast TypeScript execution
- ✅ **Environment variables**: Reads from `.env` file

### Dockerfile Structure
Our Dockerfile is simple and effective:
- Uses `oven/bun:1.1.29` for fast TypeScript/JavaScript runtime
- Installs `curl` for health checks
- Runs TypeScript directly (no build step needed)
- Exposes port 3000 with health monitoring

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start development server with hot-reload |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun test` | Run test suite |

## 🧪 Testing

### Quick Test
```bash
# Test basic endpoint
curl http://localhost:3000/properties/amenities

# Test health endpoint (Docker)
curl http://localhost:3000/health

# Run test suite (if exists)
bun test
```

### Test Script
```bash
chmod +x test_endpoints.sh
./test_endpoints.sh
```

## 📡 API Endpoints

### **🔓 Public Endpoints**
```
GET    /properties/amenities     # Get allowed amenities
GET    /properties               # Search properties (with filters)
GET    /properties/:id           # Get property by ID
```

### **🔐 Protected Endpoints** (require JWT)
```
POST   /properties               # Create new property
PUT    /properties/:id           # Update property
DELETE /properties/:id           # Delete property
PATCH  /properties/:id/status    # Update status
PATCH  /properties/:id/availability  # Update availability
GET    /properties/owner/:ownerId    # Properties by owner
```

### **👤 Auth Endpoints**
```
POST   /auth/register            # Register user
POST   /auth/login               # Login user
```

## 📝 Examples

### Register User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Create Property
```bash
curl -X POST http://localhost:3000/properties \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Modern House",
    "description": "Beautiful house in Buenos Aires",
    "price": 150.00,
    "address": "Av. Corrientes 1234",
    "city": "Buenos Aires",
    "country": "Argentina",
    "amenities": ["wifi", "kitchen", "parking"],
    "images": ["https://example.com/image1.jpg"],
    "bedrooms": 3,
    "bathrooms": 2,
    "max_guests": 6,
    "owner_id": "your-user-uuid"
  }'
```

### Search Properties
```bash
curl "http://localhost:3000/properties?city=Buenos%20Aires&min_price=100&max_price=200"
```

## 🏗️ Project Structure

```
apps/backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation, etc.
│   ├── types/           # TypeScript types
│   ├── validators/      # Input validation
│   └── config/          # Database, storage config
├── database/
│   ├── setup.sql        # Database setup script
│   └── README.md        # Database documentation
├── test_endpoints.sh    # Quick API testing
└── package.json
```

## 🛡️ Security Features

- **JWT Authentication** for protected endpoints
- **Input validation** with Zod schemas
- **Row Level Security** in Supabase
- **Rate limiting** to prevent abuse
- **CORS** properly configured

## 🔧 Development

### Add New Endpoint
1. Create controller in `src/controllers/`
2. Add service logic in `src/services/`
3. Define types in `src/types/`
4. Add route in `src/routes/`
5. Add validation if needed

### Database Changes
1. Update `database/setup.sql`
2. Test in development
3. Document changes in `database/README.md`

## 🚨 Troubleshooting

### **Server won't start**
- ✅ Check environment variables in `.env`
- ✅ Make sure Supabase is configured
- ✅ Run `bun install` again

### **Database errors**
- ✅ Execute `database/setup.sql` in Supabase
- ✅ Check SUPABASE_URL and keys
- ✅ Confirm tables exist

### **Auth not working**
- ✅ Check JWT_SECRET in `.env`
- ✅ Make sure token is valid
- ✅ Verify RLS is configured

### **Endpoints return 404**
- ✅ Confirm server is running
- ✅ Check URL and HTTP method
- ✅ Review server logs

## 🤝 Contributing

1. **Fork** the repository
2. **Create branch**: `git checkout -b feature/amazing-feature`
3. **Test** your changes locally
4. **Document** new endpoints/changes
5. **Submit** pull request

### Contribution Guidelines
- ✅ Follow TypeScript best practices
- ✅ Add tests for new functionality
- ✅ Update documentation
- ✅ Use conventional commits

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Schema Validation](https://zod.dev/)

---

**Need help?** Open an issue or check the database documentation at [`database/README.md`](./database/README.md) 🚀