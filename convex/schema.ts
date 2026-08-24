import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  // One backup document per signed-in user — synced live to every device
  // that is logged in to the same account.
  user_backups: defineTable({
    // Optional to tolerate rows created by the old anonymous-key system —
    // they're not indexed by userId and are simply ignored. New rows always
    // carry the signed-in user's identity.subject.
    userId: v.optional(v.string()),
    // Legacy field from the old recovery-key backups; kept so existing rows
    // keep validating. Never written by the current code.
    anonymousId: v.optional(v.string()),
    data: v.any(), // the whole app state: theme, schedule, tasks, timer, savings, projects
    lastUpdated: v.number(),
  }).index("by_userId", ["userId"]),
});
