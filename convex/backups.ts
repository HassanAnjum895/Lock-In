import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Fetch all backup rows for a user, newest first.
 *
 * One row per user is the intended state, but multiple rows exist for users
 * who saved before the keying was fixed (it used to use `identity.subject`,
 * which includes the session id, so each device/sign-in created its own row).
 * Consolidating here keeps both reads and writes safe until the duplicates
 * are cleaned up.
 */
async function latestBackupRows(
  ctx: MutationCtx | QueryCtx,
  userId: string
): Promise<Doc<"user_backups">[]> {
  const rows = await ctx.db
    .query("user_backups")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  rows.sort((a, b) => (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0));
  return rows;
}

export const saveBackup = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Stable across sessions and devices — `identity.subject` includes the
    // session id, which would give every device its own private backup.
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const rows = await latestBackupRows(ctx, userId);
    // Delete stale duplicate rows (pre-fix artifacts), keeping the newest.
    for (const row of rows.slice(1)) {
      await ctx.db.delete(row._id);
    }
    const existing = rows[0];
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
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const rows = await latestBackupRows(ctx, userId);
    return rows[0] ?? null;
  },
});
