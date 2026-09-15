import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/session";
import Navbar from "@/components/Navbar";
import NewStudyForm from "@/components/NewStudyForm";

export const metadata: Metadata = {
  title: "New Study",
};

export default async function NewStudyPage() {
  if (!(await isAuthenticated())) redirect("/login?from=/study/new");
  return (
    <>
      <Navbar />
      <NewStudyForm />
    </>
  );
}