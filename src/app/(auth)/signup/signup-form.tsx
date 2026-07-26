"use client";

import { useActionState } from "react";
import { signUp, signInWithGoogle, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUp,
    null
  );

  return (
    <div className="mt-6 space-y-4">
      <form action={async () => signInWithGoogle("/dashboard")}>
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>

      <div className="relative py-2 text-center text-xs text-slate-500">
        <span className="relative z-10 bg-slate-900 px-2">or email</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800" />
      </div>

      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state?.success && (
          <p className="text-sm text-emerald-400">{state.success}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
