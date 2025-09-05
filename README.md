# 📄 DocWise

**Your intelligent document assistant**

DocWise is a powerful AI-powered document analysis platform that allows you to upload PDF documents and have intelligent conversations with them. Built with modern web technologies, it provides instant insights, summaries, and answers to your questions about any document.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20DocWise-green?style=for-the-badge&logo=vercel)](https://doc-wise.vercel.app/)
![DocWise Logo](https://img.shields.io/badge/DocWise-Intelligent%20Document%20Assistant-blue?style=for-the-badge&logo=pdf)

## 🖼️ Screenshots

<div align="center">
  <img src="assets/1.png" alt="DocWise Interface" width="800" />
  <p><em>Main interface showing document upload and chat functionality</em></p>
</div>

<div align="center">
  <img src="assets/2.png" alt="DocWise Chat" width="800" />
  <p><em>AI-powered chat interface with document analysis</em></p>
</div>

## ✨ Features

- 📤 **PDF Upload & Processing** - Upload PDF documents and extract text using Google Gemini AI
- 🤖 **AI-Powered Chat** - Ask questions about your documents and get intelligent responses
- 🔍 **Semantic Search** - Find relevant information using advanced embedding-based search
- 📊 **Document Summarization** - Get automatic summaries and suggested questions
- 🎨 **Modern UI** - Beautiful, responsive interface with dark/light theme support
- 🔐 **Secure Authentication** - User authentication with NextAuth.js
- ⚡ **Real-time Streaming** - Get responses streamed in real-time
- 📱 **Mobile Responsive** - Works seamlessly on all devices

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Zustand** - State management
- **React Query** - Data fetching and caching
- **Motion** - Animation library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **NextAuth.js** - Authentication
- **Argon2** - Password hashing

### AI & ML
- **Google Gemini 2.5 Flash** - Document processing and text generation
- **Cohere AI** - Text embeddings for semantic search

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- **Google Gemini API Key**
- **Cohere API Key**

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/docwise.git
   cd docwise
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/docwise"

   # Authentication
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"

   # AI Services
   GEMINI_API_KEY="your-gemini-api-key"
   COHERE_API_KEY="your-cohere-api-key"

   # Optional: For production
   NODE_ENV="development"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🌐 Live Demo

Try DocWise right now! Visit our live demo at [https://doc-wise.vercel.app/](https://doc-wise.vercel.app/)

- Upload any PDF document
- Ask questions about the content
- Experience the AI-powered analysis

## 🎯 Usage

### 1. **Upload a Document**
- Click the upload area or drag and drop a PDF file
- Wait for the document to be processed
- View the automatic summary and suggested questions

### 2. **Ask Questions**
- Type your question in the input field
- Get real-time AI-powered responses
- Ask follow-up questions for deeper insights

### 3. **Explore Features**
- View document summaries
- Use suggested questions as starting points
- Switch between light and dark themes
- Access your chat history (when logged in)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (pages)/           # Main application pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── chat/             # Chat-related components
│   ├── layout/           # Layout components
│   ├── pdf/              # PDF handling components
│   ├── theme/            # Theme components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
│   ├── arrayStorage.ts   # In-memory storage
│   ├── cohere.ts         # Cohere AI integration
│   ├── embeddings.ts     # Embedding utilities
│   ├── gemini.ts         # Google Gemini integration
│   └── prisma.ts         # Database client
├── store/                # Zustand stores
└── hooks/                # Custom React hooks
```

## 🔧 API Endpoints

- `POST /api/upload-pdf` - Upload and process PDF documents
- `POST /api/ask` - Ask questions about uploaded documents
- `POST /api/auth/signup` - User registration
- `GET /api/auth/session` - Get current user session
- `GET /api/files` - Get user's uploaded files
- `GET /api/storage` - Get storage statistics

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Other Platforms

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** - For powerful AI document processing
- **Cohere** - For semantic search capabilities
- **Vercel** - For hosting and deployment platform
- **shadcn/ui** - For beautiful UI components
- **Next.js Team** - For the amazing React framework

