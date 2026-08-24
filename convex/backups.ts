import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveBackup = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const existing = await ctx.db
      .query("user_backups")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("user_backups", {
        userId,
        data: args.data,
        lastUpdated: Date.now(),
      });
    }
  },
});

export const getBackup = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("user_backups")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});
