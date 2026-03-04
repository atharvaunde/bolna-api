# Bolna API

A comprehensive banking and financial services API built with Node.js, Express, and MongoDB. This API provides endpoints for customer management, transaction analytics, risk assessment, and integration with Bolna's voice AI platform.

## 🚀 Features

- **Customer Management** - Retrieve and view customer profiles with filtering and search
- **Transaction Analytics** - Track and analyze financial transactions with detailed filtering
- **Risk Assessment** - Calculate and monitor customer risk scores
- **Financial Insights** - Customer financial insights and recommendations
- **Product Management** - Manage banking products (savings accounts, credit cards, etc.)
- **Call Management** - Integration with Bolna voice AI for automated calls
- **Knowledgebase Integration** - Document ingestion and retrieval for AI context
- **Webhook Support** - Handle external webhook events
- **Health Monitoring** - API health checks and metadata endpoints

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js v5
- **Database:** MongoDB (via Mongoose)
- **Security:** Helmet, CORS, HPP
- **HTTP Client:** Axios
- **Environment:** dotenv

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/atharvaunde/bolna-api.git
   cd bolna-api
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp sample.env .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   BOLNA_API_KEY=your_bolna_api_key
   PUBLIC_API_URL=your_public_api_url
   BOLNA_AGENT_ID=your_bolna_agent_id
   BOLNA_FROM_NUMBER=your_phone_number
   BOLNA_AGENT_NAME=your_agent_name
   BOLNA_ENTITY_NAME=your_entity_name
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   yarn dev
   
   # Production mode
   yarn start
   ```

## 🌐 API Endpoints

### Health & Metadata
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/ping` | Health check with database status |
| GET | `/api/health/meta` | API metadata and version info |

### Customer Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | Get all customers (with pagination, search & filters) |
| GET | `/api/customers/:customerId` | Get single customer details |
| POST | `/api/customers/:customerId/trigger-call` | Trigger voice call to customer |

**Query Parameters for GET /api/customers:**
- `page`, `limit` - Pagination
- `sortBy`, `sortOrder` - Sorting (default: createdAt, desc)
- `query` - Search across name, email, phone, customerId
- `riskLevel` - Filter by risk level

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions/:customerId` | Get customer transactions (with filters) |

**Query Parameters:**
- `page`, `limit` - Pagination
- `sortBy`, `sortOrder` - Sorting
- `startDate`, `endDate` - Date range filtering
- `transactionType` - CREDIT or DEBIT
- `category` - Transaction category
- `productId`, `productType` - Product filtering
- `status`, `channel`, `merchantName` - Additional filters

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/monthly-transactions` | Monthly transaction statistics |
| GET | `/api/analytics/financial-summary/:customerId` | Customer financial summary (6 months) |

**Query Parameters:**
- `months` - Number of months to analyze (max 24)

### Risk Assessment
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/risk/calculate/:customerId` | Calculate risk score for customer |
| GET | `/api/risk/summary` | Get risk summary statistics |

### Customer Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer-insights/:customerId` | Get customer financial insights |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/:customerId` | Get all products for a customer |

### Calls
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calls/:customerId` | Get all calls for a customer |
| GET | `/api/calls/:customerId/:callId` | Get specific call details |

**Query Parameters:**
- `page`, `limit` - Pagination

### Knowledgebase
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledgebase/serve/:token` | Serve knowledgebase markdown |
| POST | `/api/knowledgebase/generate` | Generate and ingest knowledgebase |
| POST | `/api/knowledgebase/preview` | Preview knowledgebase content |
| GET | `/api/knowledgebase/credit-utilization/:customerId` | Get credit utilization data |
| POST | `/api/knowledgebase/customer-context` | Get customer context for AI |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook` | Handle webhook events |

## 📁 Project Structure

```
bolna-api/
├── configs/              # Configuration files
│   ├── bolna.js         # Bolna API configuration
│   └── database.js      # MongoDB connection setup
├── controllers/         # Request handlers
│   ├── analytics.controller.js
│   ├── calls.controller.js
│   ├── customer.controller.js
│   ├── customerInsights.controller.js
│   ├── health.controller.js
│   ├── knowledgebase.controller.js
│   ├── product.controller.js
│   ├── risk.controller.js
│   ├── transaction.controller.js
│   └── webhook.controller.js
├── models/              # MongoDB schemas
│   ├── calls.js
│   ├── customers.js
│   ├── products.js
│   ├── riskScores.js
│   ├── transactions.js
│   └── users.js
├── routers/             # Route definitions
│   ├── analytics.route.js
│   ├── calls.route.js
│   ├── customer.route.js
│   ├── customerInsights.route.js
│   ├── health.route.js
│   ├── knowledgebase.route.js
│   ├── product.route.js
│   ├── risk.route.js
│   ├── transaction.route.js
│   ├── webhook.route.js
│   ├── index.js         # Route aggregator
│   └── middlewares/     # Custom middleware
│       ├── error.js
│       └── global.js
├── services/            # Business logic
│   ├── analytics.service.js
│   ├── calls.service.js
│   ├── customer.service.js
│   ├── customerInsights.service.js
│   ├── health.service.js
│   ├── knowledgebase.service.js
│   ├── product.service.js
│   ├── risk.service.js
│   ├── transaction.service.js
│   └── webhook.service.js
├── utils/               # Utility functions
│   └── error.js         # Error handling utilities
├── scripts/             # Database scripts
│   └── mockData.js      # Mock data generation
├── index.js             # Application entry point
├── package.json
├── sample.env
└── README.md
```

## 🔒 Security Features

- **Helmet** - Secure HTTP headers
- **CORS** - Cross-Origin Resource Sharing configuration
- **HPP** - HTTP Parameter Pollution protection
- **Environment Variables** - Sensitive data protection

## 🎯 Error Handling

The API uses centralized error handling with consistent error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message here",
  "error": "Detailed error information"
}
```

Success responses follow this structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": { }
}
```

## 📜 Scripts

```bash
# Start in production mode
yarn start

# Start in development mode with auto-reload
yarn dev

# Format code with Prettier
yarn format
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Atharva Unde**
- GitHub: [@atharvaunde](https://github.com/atharvaunde)
- Email: atharv.unde59@gmail.com

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database powered by [MongoDB](https://www.mongodb.com/)
- Voice AI integration with [Bolna](https://bolna.dev/)

---

For more information or support, please open an issue on the GitHub repository.
