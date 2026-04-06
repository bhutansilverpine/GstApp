import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClerkProvider, SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";
import {
  ArrowRight,
  Check,
  Zap,
  Shield,
  BarChart3,
  FileText,
  Calculator,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <ClerkProvider>
      <div className="flex flex-col min-h-screen">
        {/* Header with Auth */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-primary">Silverpine Ledger</h1>
              </div>
              <div className="flex items-center gap-4">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <Button variant="ghost">Sign In</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button>Get Started</Button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </div>
          </div>
        </header>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 sm:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Simplify GST Compliance
              <br />
              with Intelligent Automation
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Streamline your GST returns, invoice management, and tax calculations
              with our AI-powered platform. Focus on your business while we handle
              the compliance.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">
              Features
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage GST compliance
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Our platform provides comprehensive tools for GST compliance,
              invoicing, and financial management.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">GST Returns</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Auto-generate GSTR-1, GSTR-3B, and other returns with AI-powered
                  data validation and error detection.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Calculator className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Tax Calculator</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Calculate CGST, SGST, IGST automatically with real-time tax rates
                  and rules for all products and services.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Compliance Ready</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stay compliant with latest GST laws and regulations with automatic
                  updates and alerts for due dates.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Analytics & Reports</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get detailed insights into your business finances with comprehensive
                  reports and interactive dashboards.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Multi-Organization</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage multiple businesses and organizations from a single account
                  with easy switching and consolidated reports.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">AI-Powered</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Leverage artificial intelligence for invoice processing, anomaly
                  detection, and smart tax optimization suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to simplify your GST compliance?
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Join thousands of businesses already using Silverpine Ledger to
              streamline their tax compliance and focus on growth.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/sign-up">
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/40 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Silverpine Ledger. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </ClerkProvider>
  );
}
