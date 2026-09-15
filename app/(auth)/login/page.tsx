import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/dashboard");
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 p-6 dark:from-neutral-950 dark:to-neutral-900">
      <LoginForm />
    </main>
  );
}