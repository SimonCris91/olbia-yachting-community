import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  role: text("role", { enum: ["private", "operator", "company"] }).notNull().default("private"),
  plan: text("plan", { enum: ["standard", "premium", "yards"] }).notNull().default("standard"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_profiles_user_id").on(table.userId)]);

export const aiUsage = sqliteTable("ai_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subject: text("subject").notNull(),
  day: text("day").notNull(),
  requests: integer("requests").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_ai_usage_subject_day").on(table.subject, table.day)]);

export const serviceRequests = sqliteTable("service_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: text("owner_user_id").notNull(),
  title: text("title").notNull(),
  details: text("details").notNull().default(""),
  category: text("category").notNull(),
  location: text("location").notNull(),
  status: text("status", { enum: ["open", "accepted", "closed"] }).notNull().default("open"),
  acceptedByUserId: text("accepted_by_user_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_service_requests_location_status").on(table.location, table.status), index("idx_service_requests_owner").on(table.ownerUserId)]);

export const workspaceItems = sqliteTable("workspace_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: text("owner_user_id").notNull(),
  kind: text("kind", { enum: ["task", "purchase"] }).notNull(),
  title: text("title").notNull(),
  details: text("details").notNull().default(""),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_workspace_items_owner_kind").on(table.ownerUserId, table.kind)]);
