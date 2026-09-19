import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import CampaignsPanel from "./ui";

export default async function CampaignsPage() {
  if (!(await getServerSession(authOptions))) redirect("/signin");
  return <CampaignsPanel />;
}