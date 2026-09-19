import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SettingsPanel from "./ui";

export default async function SettingsPage() {
  if (!(await getServerSession(authOptions))) redirect("/signin");
  return <SettingsPanel />;
}