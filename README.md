# Next.js Base Skeleton App

A production-ready skeleton application built with Next.js, featuring authentication, AI integration, and modern React patterns. Perfect for rapid project prototyping and development.

## 🚀 Features

- **Authentication**: Complete NextAuth.js setup with Google and Azure AD providers
- **AI Integration**: Built-in Claude API integration with rate limiting and caching
- **Database**: MongoDB connection with Mongoose ODM
- **UI Components**: Pre-built ShadCN/UI components with Tailwind CSS
- **User Management**: Basic user profile system with role-based access
- **Caching**: Intelligent response caching for improved performance
- **Rate Limiting**: API protection against abuse
- **Modern Stack**: Next.js 15, React 19, and latest dependencies

## 📦 What's Included

### Core Components
- `ClaudeChat` - AI chat interface with text input/output
- `SettingsPage` - Simplified user profile management
- `Header` - Reusable navigation component with authentication
- UI Kit - Button, Card, Alert components

### API Routes
- `/api/auth/[...nextauth]` - Authentication endpoints
- `/api/claude` - AI chat API with caching
- `/api/user` - User profile management

### Database Models
- `User` - Basic user information (name, email, role)
- `CachedResponse` - Generic caching for API responses

## 🛠️ Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env.local` and fill in your values:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/your-app-name

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# Azure AD OAuth (optional)
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id

# Claude AI
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 🔧 Configuration

### Authentication Providers

The skeleton includes Google and Azure AD providers. To add more providers, edit `src/pages/api/auth/[...nextauth].js`.

### Database Models

Modify or extend the models in `src/models/`:
- Add new fields to the User model
- Create new models for your app's needs

### UI Customization

- Update `tailwind.config.mjs` for design system changes
- Modify components in `src/components/ui/` for consistent styling
- Add new pages in `src/pages/`

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── ClaudeChat.js # AI chat interface
│   └── settings/     # Settings components
├── pages/
│   ├── api/          # API routes
│   ├── index.js      # Landing page
│   └── _app.js       # App configuration
├── models/           # Database models
├── lib/              # Utility libraries
└── utils/            # Helper functions
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

The app is compatible with any Node.js hosting platform:
- Heroku
- Railway
- DigitalOcean App Platform
- AWS/GCP/Azure

## 🔒 Security Features

- Rate limiting on AI API endpoints
- Input validation and sanitization
- Secure session management with NextAuth.js
- Environment variable protection
- CSRF protection built-in

## 📊 Performance Features

- Response caching with MongoDB
- Optimized bundle splitting
- Image optimization ready
- Edge API routes supported

## 🎨 Customization Ideas

This skeleton is perfect for building:
- AI-powered SaaS applications
- Content management systems
- User dashboards and admin panels
- API-first applications
- Modern web applications

## 🤝 Contributing

This is a base skeleton - fork it and make it your own! Common improvements:
- Add more UI components
- Implement additional auth providers
- Add email systems
- Include payment integration
- Add more database models

## 📝 License

MIT License - feel free to use this for any project!

## 🆘 Support

This skeleton provides a solid foundation but you may need to:
- Adjust for your specific use case
- Add business logic
- Customize the UI/UX
- Configure for your deployment environment

---

**Happy coding!** 🎉

Built with ❤️ for rapid development and modern web applications.