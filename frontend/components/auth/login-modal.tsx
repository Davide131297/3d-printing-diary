"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { login, signup } from "@/app/auth/actions";
import { Zap, Loader2 } from "lucide-react";

export default function LoginModal() {
  const [loginState, loginAction, isLoginPending] = useActionState(login, null);
  const [signupState, signupAction, isSignupPending] = useActionState(
    signup,
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="h-14 px-8 text-lg rounded-sm border border-primary/50 bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary transition-all duration-300 backdrop-blur-sm group relative overflow-hidden"
        >
          <span className="absolute inset-0 bg-primary/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
          <Zap className="mr-2 h-5 w-5 group-hover:fill-current z-10" />
          <span className="z-10">System Starten</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Authentifizierung</DialogTitle>
          <DialogDescription>
            Melde dich an oder registriere dich, um fortzufahren.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="m@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" name="password" type="password" required />
          </div>

          {(loginState?.error || signupState?.error) && (
            <div className="text-destructive text-sm">
              {loginState?.error || signupState?.error}
            </div>
          )}

          {signupState?.message && (
            <div className="text-green-500 text-sm">{signupState.message}</div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              formAction={loginAction}
              className="w-full"
              disabled={isLoginPending || isSignupPending}
            >
              {isLoginPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Anmelden
            </Button>
            <Button
              formAction={signupAction}
              variant="outline"
              className="w-full"
              disabled={isLoginPending || isSignupPending}
            >
              {isSignupPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Registrieren
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
