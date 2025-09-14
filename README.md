# Digital Marketing Platform

> The ultimate AI-powered platform for launching, scaling, and growing businesses through intelligent digital marketing automation.

## 🚀 Vision

This platform represents the new gold standard in digital marketing automation, designed to replace entire marketing departments with AI-driven intelligence. Built with enterprise-grade architecture and world-class UX/UI, it serves as an all-in-one solution for business scaling through digital marketing.

## ✨ Key Features

- **AI Campaign Creation**: Generate high-converting ad campaigns, email sequences, and SMS flows
- **Smart Funnel Builder**: Conversion-optimized funnels that adapt based on user behavior
- **Business Intelligence**: Real-time insights and predictive analytics
- **Multi-Channel Automation**: Email, SMS, social media, and ad platform integration
- **n8n Integration**: Seamless workflow automation with n8n and Poppy API
- **Enterprise Security**: JWT authentication, role-based access, and data encryption

## 🏗️ Architecture

### Frontend Stack
- **Next.js 14**: React framework with App Router
- **React 18**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management

### Backend Infrastructure
- **Node.js**: Runtime environment
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **ClickHouse**: Analytics and time-series data
- **Elasticsearch**: Search and logging
- **MinIO**: S3-compatible object storage

### Development Tools
- **Docker Compose**: Local development environment
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Drizzle ORM**: Type-safe database operations

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd digital-marketing-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development services**
   ```bash
   # Start all services (PostgreSQL, Redis, ClickHouse, Elasticsearch)
   docker-compose up -d
   
   # Start with monitoring tools (includes Kibana)
   docker-compose --profile monitoring up -d
   
   # Start with development tools (includes Mailhog)
   docker-compose --profile development up -d
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the application**
   - Frontend: http://localhost:3001
   - Kibana (if enabled): http://localhost:5601
   - MinIO Console: http://localhost:9001
   - Mailhog (if enabled): http://localhost:8025

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── charts/           # Chart components
│   └── providers/        # Context providers
├── lib/                  # Utility libraries
│   ├── auth/            # Authentication utilities
│   ├── db/              # Database configuration
│   ├── api/             # API utilities
│   └── utils.ts         # Common utilities
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── types/               # TypeScript type definitions
└── styles/              # Additional styles
```

## 🔧 Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript checks

# Database
npm run db:generate      # Generate database migrations
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open Drizzle Studio

# Docker
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:logs      # View service logs
```

### Code Quality

- **ESLint**: Enforces code quality and consistency
- **TypeScript**: Provides type safety and better developer experience
- **Prettier**: Ensures consistent code formatting
- **Husky**: Git hooks for pre-commit checks

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions system
- **Data Encryption**: Sensitive data encryption at rest
- **Rate Limiting**: API rate limiting and DDoS protection
- **CORS Configuration**: Secure cross-origin resource sharing
- **Input Validation**: Comprehensive input sanitization

## 📊 Performance Optimizations

- **Server-Side Rendering**: Next.js SSR for optimal performance
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic code splitting and lazy loading
- **Caching Strategy**: Multi-layer caching with Redis
- **Database Indexing**: Optimized database queries
- **CDN Integration**: Asset delivery optimization

## 🔌 Integrations

### AI & Automation
- **OpenAI**: AI-powered content generation
- **n8n**: Workflow automation platform
- **Poppy API**: Knowledge base and content management

### Marketing Platforms
- **Google Ads**: Campaign management
- **Facebook Ads**: Social media advertising
- **Mailchimp**: Email marketing
- **Twilio**: SMS marketing

### Analytics & Monitoring
- **Google Analytics**: Web analytics
- **Mixpanel**: Product analytics
- **Sentry**: Error monitoring
- **LogRocket**: Session replay

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Configure environment variables**
3. **Deploy with automatic CI/CD**

### Docker Production

```bash
# Build production image
docker build -t digital-marketing-platform .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Monitoring & Analytics

- **Application Performance**: Real-time performance monitoring
- **User Analytics**: Comprehensive user behavior tracking
- **Business Metrics**: Revenue, conversion, and growth metrics
- **System Health**: Infrastructure monitoring and alerting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Built with ❤️ for the future of digital marketing**