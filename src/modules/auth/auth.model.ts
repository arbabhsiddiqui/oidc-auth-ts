import {
    pgTable,
    serial,
    varchar,
    integer,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";


export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(), // bcrypt hash

    resetToken: varchar("reset_token", { length: 255 }),
    resetTokenExpiresAt: timestamp("reset_token_expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull()
        .$onUpdateFn(() => new Date()),
});



export const clients = pgTable("clients", {
    id: serial("id").primaryKey(),

    clientId: varchar("client_id", { length: 255 }).notNull().unique(),
    clientSecret: varchar("client_secret", { length: 255 }).notNull(),

    redirectUri: varchar("redirect_uri", { length: 500 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authCodes = pgTable("auth_codes", {
    id: serial("id").primaryKey(),

    code: varchar("code", { length: 255 }).notNull(),

    userId: integer("user_id").references(() => users.id).notNull(),
    clientId: integer("client_id").references(() => clients.id).notNull(),

    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const sessions = pgTable("sessions", {
    id: serial("id").primaryKey(),

    userId: integer("user_id").references(() => users.id).notNull(),

    sessionToken: varchar("session_token", { length: 255 }).notNull(),

    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const refreshTokens = pgTable("refresh_tokens", {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
        .references(() => users.id)
        .notNull(),
    clientId: integer("client_id")
        .references(() => clients.id)
        .notNull(),

    token: varchar("token", { length: 500 }).notNull(),

    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
})