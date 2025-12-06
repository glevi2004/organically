# 🌱 Organically - AI-Powered Social Media Content Manager

**Plan. Create. Organize. Stay Consistent — With AI.**

A Next.js application that helps creators and brands manage their social media content with AI-powered planning, organization, and content generation tools.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` or `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# OpenAI Configuration (for AI Assistant)
OPENAI_API_KEY=...
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## ✨ Features

- 🤖 **AI Assistant** - LangChain-powered chatbot with profile-aware context for content ideas and strategy
- 🎯 **Profile-Based Organization** - Manage multiple content profiles with custom settings
- 💡 **Idea Dump** - Quick note-taking for capturing content ideas with drag-and-drop reordering
- 📅 **Content Calendar** - Visual planning and scheduling for your posts
- 📝 **Post Manager** - Create, edit, and organize your content with a rich text editor
- 🎨 **Multi-Platform Support** - Instagram, TikTok, YouTube, X (Twitter), LinkedIn
- 📊 **Kanban Board** - Drag-and-drop workflow: Idea → Draft → Ready → Posted
- 🔐 **Secure Authentication** - Firebase Auth with email/password and Google OAuth
- 🎨 **Rich Text Editor** - TipTap-powered editor with markdown support

## 🤖 AI Integration

Organically features an AI assistant powered by **LangChain** and **OpenAI GPT-4o-mini**. The AI is context-aware and uses your profile data to provide personalized suggestions:

- **Profile Context Injection** - The AI understands your brand voice, niche, target audience, and platforms
- **Content Ideas** - Generate content ideas tailored to your audience and posting schedule
- **Strategy Recommendations** - Get platform-specific best practices and growth strategies
- **Streaming Responses** - Real-time streaming for a responsive chat experience

### How it works

1. Your profile settings (brand voice, niche, audience, platforms, consistency level) are used to build a dynamic system prompt
2. The LangChain agent processes your messages with full context
3. Responses are streamed via Server-Sent Events for a smooth UX

## 🛠️ Tech Stack

| Category             | Technology                       |
| -------------------- | -------------------------------- |
| **Framework**        | Next.js 16 (App Router)          |
| **Language**         | TypeScript                       |
| **Database**         | Firebase Firestore               |
| **Authentication**   | Firebase Auth                    |
| **Storage**          | Firebase Storage                 |
| **AI/LLM**           | LangChain + OpenAI (GPT-4o-mini) |
| **Styling**          | Tailwind CSS 4                   |
| **UI Components**    | Radix UI, shadcn/ui              |
| **Rich Text Editor** | TipTap                           |
| **Drag & Drop**      | @dnd-kit                         |
| **Animations**       | Framer Motion                    |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/chat/             # AI chat API endpoint
│   ├── auth/                 # Login/signup
│   ├── onboarding/           # Multi-step onboarding flow
│   └── profile/[profileId]/  # Main app pages
│       ├── home/             # Dashboard
│       ├── idea-dump/        # Quick idea notes
│       ├── calendar/         # Content scheduling
│       ├── posts/            # Post management (Kanban)
│       ├── profile/          # Profile settings
│       └── settings/         # App settings
├── components/               # Reusable UI components
├── contexts/                 # React contexts (Auth, Profile, Sidebar)
├── services/                 # Firebase service layer
├── hooks/                    # Custom React hooks
├── lib/
│   ├── langchain/            # AI agent configuration
│   │   ├── agent.ts          # LangChain agent setup
│   │   ├── context.ts        # Profile context builder
│   │   └── tools/            # Agent tools (extensible)
│   └── ...                   # Utilities and constants
└── types/                    # TypeScript interfaces
```

## 🔐 Security

- Firebase Authentication for secure user management
- Firestore Security Rules with user ownership validation
- Storage rules for secure file uploads (5MB limit, image types only)
- Server-side validation and access control

## 🌐 Deploy to Vercel

The easiest deployment option:

1. Push your code to GitHub
2. Import to Vercel
3. Add environment variables (Firebase + OpenAI)
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## 📝 License

This project is for personal/educational use.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the maintainers.

---

**Built with ❤️ using Next.js, Firebase, and LangChain**
