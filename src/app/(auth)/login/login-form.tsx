"use client";

import { useActionState } from "react";
import { signIn, signInWithGoogle, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, null);

  return (
    <div className="space-y-5">
      <form
        action={async () => {
          await signInWithGoogle(next);
        }}
      >
        <Button type="submit" variant="secondary" className="w-full" size="md">
          Lanjutkan dengan Google
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-rule" />
        <span className="micro text-[10px]">atau pakai email</span>
        <span className="h-px flex-1 bg-rule" />
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
          />
        </div>

        <div>
          <Label htmlFor="password">Kata sandi</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-[13px] text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Masuk…" : "Masuk"}
        </Button>
      </form>
    </div>
  );
}
