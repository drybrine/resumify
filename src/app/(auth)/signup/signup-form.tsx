"use client";

import { useActionState } from "react";
import { signUp, signInWithGoogle, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, null);

  return (
    <div className="space-y-5">
      <form action={async () => signInWithGoogle("/dashboard")}>
        <Button type="submit" variant="secondary" className="w-full">
          Daftar dengan Google
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-rule" />
        <span className="micro text-[10px]">atau pakai email</span>
        <span className="h-px flex-1 bg-rule" />
      </div>

      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Nama lengkap</Label>
          <Input id="fullName" name="fullName" autoComplete="name" placeholder="Nama sesuai CV" />
        </div>

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
            minLength={8}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-[13px] text-danger">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-[13px] text-ok">{state.success}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Membuat akun…" : "Buat akun gratis"}
        </Button>
      </form>
    </div>
  );
}
