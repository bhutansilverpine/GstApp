import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Shield, Sparkles, Zap, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
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
            Get started for free
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create your workspace and start your 14-day free trial
          </p>
        </div>

        {/* Clerk Sign-Up Component with premium styling */}
        <div className="card-clerk-premium animate-scale-in">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Create your account
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Start automating your accounting today
              </p>
            </div>

            <SignUp
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border-0 p-0",
                },
              }}
            />
          </div>
        </div>

        {/* Features section */}
        <div className="mt-8 grid grid-cols-1 gap-3">
          {[
            {
              title: "AI-Powered Accounting",
              description: "Automatically process receipts and generate journal entries",
              icon: Zap,
              color: "bg-purple-100 text-purple-600"
            },
            {
              title: "Bank Reconciliation",
              description: "Smart matching with 80%+ accuracy",
              icon: Shield,
              color: "bg-green-100 text-green-600"
            },
            {
              title: "BIT Compliance",
              description: "One-click Business Income Tax exports",
              icon: CheckCircle2,
              color: "bg-blue-100 text-blue-600"
            },
          ].map((feature, index) => (
            <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors duration-200">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", feature.color)}>
                <feature.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex items-center justify-center gap-4 pt-4">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Shield className="h-3 w-3 text-green-500" />
            <span>Bank-level security</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Sparkles className="h-3 w-3 text-purple-500" />
            <span>AI-powered</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <CheckCircle2 className="h-3 w-3 text-blue-500" />
            <span>GST compliant</span>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-primary hover:text-primary/80 inline-flex items-center gap-1 group"
            >
              Sign in instead
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </p>

          {/* Privacy & terms */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to our{" "}
              <a href="#" className="underline hover:text-foreground">
                Terms of Service
              </a>
              {" "}
              <a href="#" className="underline hover:text-foreground">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Pricing info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
