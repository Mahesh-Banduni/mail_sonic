import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardClient from "./ui";
export default async function DashboardPage() {
  if (!(await getServerSession(authOptions))) redirect("/signin");
  return <DashboardClient />;
}
