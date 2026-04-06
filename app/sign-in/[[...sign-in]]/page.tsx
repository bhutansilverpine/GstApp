import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-xl font-bold text-primary-foreground">SL</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
        <div className="rounded-xl border bg-card p-8 shadow-lg">
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none border-0 p-0",
              },
            }}
          />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a
            href="/sign-up"
            className="font-medium text-primary hover:underline"
          >
            Sign up for free
          </a>
        </p>
      </div>
    </div>
  );
}
