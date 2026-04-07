import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-background to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-72 h-72 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-72 h-72 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo/Brand section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <span className="text-2xl font-bold text-white">SL</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">
            Sign in to continue
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Welcome back to Silverpine Ledger
          </p>
        </div>

        {/* Clerk Sign-In Component with premium styling */}
        <div className="card-clerk-premium animate-scale-in">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Sign in
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter your credentials to access your workspace
              </p>
            </div>

            <SignIn
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border-0 p-0",
                },
              }}
            />
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-primary hover:text-primary/80 inline-flex items-center gap-1 group"
            >
              Create an account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Shield className="h-3 w-3 text-green-500" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Zap className="h-3 w-3 text-blue-500" />
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-purple-500" />
              <span>Reliable</span>
            </div>
          </div>
        </div>

        {/* Privacy & terms */}
        <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-6">
          By signing in, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>
          {" and "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
