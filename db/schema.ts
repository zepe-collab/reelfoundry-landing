import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const content = sqliteTable("content", {
  id: integer("id").primaryKey(),
  contentJson: text("content_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const media = sqliteTable("media", {
  key: text("key").primaryKey(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: text("created_at").notNull(),
});

export const adminCredentials = sqliteTable("admin_credentials", {
  id: integer("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordSalt: text("password_salt").notNull(),
  passwordHash: text("password_hash").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const adminSessions = sqliteTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const adminLoginAttempts = sqliteTable("admin_login_attempts", {
  keyHash: text("key_hash").primaryKey(),
  windowStartedAt: text("window_started_at").notNull(),
  failedCount: integer("failed_count").notNull(),
  updatedAt: text("updated_at").notNull(),
});
