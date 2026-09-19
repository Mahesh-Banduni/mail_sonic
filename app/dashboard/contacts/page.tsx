import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ContactsPanel from "./ui";

export default async function ContactsPage() {
  if (!(await getServerSession(authOptions))) redirect("/signin");
  return <ContactsPanel />;
}