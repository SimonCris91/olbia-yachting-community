import { redirect } from "next/navigation";
import { getChatGPTUser } from "../chatgpt-auth";
import { isSiteOwner } from "../access";
import ControllerClient from "./controller-client";

export const dynamic = "force-dynamic";

export default async function ControllerPage() {
  const user = await getChatGPTUser();
  if (!user) redirect("/signin-with-chatgpt?return_to=%2Fcontroller");
  if (!isSiteOwner(user)) redirect("/");
  return <ControllerClient displayName={user.displayName} />;
}
