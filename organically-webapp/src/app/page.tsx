"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import TypingText from "@/components/ui/typing-text";
import { Smartphone, Sparkles, Target, CalendarDays } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8 pt-8">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col items-center justify-center text-center gap-10">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight max-w-3xl">
              Consistency. Growth. Viral Content.{" "}
              <span className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                All Done For You — With AI.
              </span>
            </h1>

            {/* Typing Animation Subheadline */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Built for creators who want:
              </p>
              <TypingText
                text={[
                  "More Reach",
                  "More Followers",
                  "Better Ideas",
                  "Cross-Platform Growth",
                  "Less Work",
                ]}
                typingSpeed={80}
                deletingSpeed={50}
                pauseDuration={2000}
                loop={true}
                className="text-xl sm:text-2xl md:text-3xl font-semibold bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent"
              />
            </div>

            {/* Supporting Line */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Choose your platforms. Tell us your goals. Organically generates a
              full content plan + outlines you can use instantly.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/auth")}
                className="px-8 py-3 bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Start Growing Now
              </button>
              <button className="px-8 py-3 border-2 border-emerald-500/30 text-foreground font-medium rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Background Gradient Effect */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-linear-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 blur-3xl rounded-full" />
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 flex items-center justify-center text-white">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">Instagram Focused</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Grow your Instagram with AI-powered content strategies tailored
                to your brand and audience.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 flex items-center justify-center text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">
                Tell Us Your Content Style
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Short-form videos, photo dumps, threads, reels, carousels —
                choose what fits you.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 flex items-center justify-center text-white">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">Define Your Growth Goal</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Follower growth, engagement, brand awareness, or creator
                monetization.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 flex items-center justify-center text-white">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">
                Get a Weekly AI Growth Plan
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Daily schedules, cross-platform optimization, content outline
                ideas — all generated automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Conversion Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="flex flex-col items-center text-center gap-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Start Growing{" "}
              <span className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Organically
              </span>{" "}
              Today.
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
              Your personalized weekly plan is only 60 seconds away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                onClick={() => router.push("/auth")}
                className="px-8 py-3 bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Get Started Free
              </button>
              <button
                onClick={() => router.push("/auth")}
                className="px-8 py-3 border-2 border-emerald-500/30 text-foreground font-medium rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
              >
                Generate My First Plan
              </button>
            </div>
          </div>
        </div>

        {/* Background Effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-green-500/10 blur-3xl rounded-full" />
          <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/10 blur-3xl rounded-full" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4">
            <span className="text-2xl font-bold">🌱 Organically</span>
            <p className="text-sm text-muted-foreground">
              © 2024 Organically. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
