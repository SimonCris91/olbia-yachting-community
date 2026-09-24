import type { ChatGPTUser } from "./chatgpt-auth";

export type ProfileRole = "private" | "operator" | "company";
export type AccessRole = ProfileRole | "owner";

function configuredValues(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isSiteOwner(user: ChatGPTUser) {
  const ownerIds = configuredValues(process.env.OWNER_USER_IDS);
  const ownerEmails = configuredValues(process.env.OWNER_EMAILS);
  return ownerIds.includes(user.userId.toLowerCase()) || ownerEmails.includes(user.email.toLowerCase());
}
