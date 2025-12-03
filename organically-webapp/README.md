# 🌱 Organically - Social Media Content Manager

**Plan. Create. Organize. Stay Consistent.**

A Next.js application that helps creators and brands manage their social media content with structured planning and organization tools.

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
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## ✨ Features

- 🎯 **Profile-Based Organization** - Manage multiple content profiles with custom settings
- 💡 **Idea Dump** - Quick note-taking for capturing content ideas
- 📅 **Content Calendar** - Visual planning and scheduling for your posts
- 📝 **Post Manager** - Create, edit, and organize your content by status
- 🎨 **Multi-Platform Support** - Instagram, TikTok, YouTube, X (Twitter), LinkedIn
- 📊 **Kanban Board** - Track posts through idea, draft, ready, and posted stages
- 🔐 **Secure Authentication** - Firebase Auth for user management

## 📖 Documentation

**For detailed planning and architecture:** See [`planning/`](planning/) directory

This includes:

- 🔧 Full feature planning documents
- 📦 Implementation details
- 🐛 Troubleshooting guides

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, shadcn/ui

## 📁 Project Structure

```
src/
├── app/
│   ├── profile/[profileId]/ # Main app pages
│   │   ├── home/           # Dashboard
│   │   ├── idea-dump/      # Quick idea notes
│   │   ├── calendar/       # Content scheduling
│   │   ├── posts/          # Post management
│   │   └── profile/        # Profile management
│   └── onboarding/         # User onboarding flow
├── components/             # Reusable UI components
├── services/              # Firebase services
├── types/                 # TypeScript type definitions
├── contexts/              # React contexts (Profile, Auth)
└── lib/                   # Utilities and constants
```

## 🔐 Security

- Firebase Authentication for secure user management
- Firestore Security Rules for data protection
- Server-side validation and access control
- Secure file uploads with Firebase Storage

## 🌐 Deploy to Vercel

The easiest deployment option:

1. Push your code to GitHub
2. Import to Vercel
3. Add Firebase environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## 📝 License

This project is for personal/educational use.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the maintainers.

---

**Built with ❤️ using Next.js and Firebase**
