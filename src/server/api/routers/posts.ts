import { clerkClient } from "@clerk/nextjs";
import { type Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

const addUserDataToPosts = async (posts: Post[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  const userById = new Map(users.map((user) => [user.id, user]));

  return posts.map(({ authorId, ...post }) => {
    const author = userById.get(authorId);
    if (!author?.username) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author for post not found",
      });
    }
    return { ...post, author: { ...author, username: author.username } };
  });
};

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    return addUserDataToPosts(posts);
  }),

  getAllByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        where: { authorId: input.userId },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });

      return addUserDataToPosts(posts);
    }),

  getMostUsedEmojis: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    const emojis = posts.flatMap(({ content }) =>
      [...new Intl.Segmenter().segment(content)].map((x) => x.segment)
    );
    const emojiCounts = new Map<string, number>();
    for (const emoji of emojis) {
      emojiCounts.set(emoji, (emojiCounts.get(emoji) ?? 0) + 1);
    }

    const sortedEmojiCounts = [...emojiCounts.entries()].sort(
      (a, b) => b[1] - a[1]
    );
    return sortedEmojiCounts.slice(0, 10).map(([emoji, count]) => ({
      emoji,
      count,
    }));
  }),

  getMostUsedEmojisByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        where: { authorId: input.userId },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });

      const emojis = posts.flatMap(({ content }) =>
        [...new Intl.Segmenter().segment(content)].map((x) => x.segment)
      );
      const emojiCounts = new Map<string, number>();
      for (const emoji of emojis) {
        emojiCounts.set(emoji, (emojiCounts.get(emoji) ?? 0) + 1);
      }

      const sortedEmojiCounts = [...emojiCounts.entries()].sort(
        (a, b) => b[1] - a[1]
      );
      return sortedEmojiCounts.slice(0, 10).map(([emoji, count]) => ({
        emoji,
        count,
      }));
    }),

  getMostActiveUsers: publicProcedure.query(async ({ ctx }) => {
    const activeUsers = await ctx.prisma.post.groupBy({
      by: ["authorId"],
      _count: { id: true },
      orderBy: [{ _count: { id: "desc" } }],
      take: 10,
    });

    const users = await clerkClient.users.getUserList({
      userId: activeUsers.map(({ authorId }) => authorId),
      limit: 100,
    });
    const userById = new Map(users.map((user) => [user.id, user]));

    return activeUsers.map(({ authorId, _count }) => ({
      authorId,
      authorName: userById.get(authorId)?.username ?? "unknown",
      count: _count.id,
    }));
  }),

  create: privateProcedure
    .input(z.object({ content: z.string().emoji().min(1).max(250) }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.create({
        data: { content: input.content, authorId: ctx.currentUserId },
      });

      return { post };
    }),

  delete: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });
      if (post?.authorId !== ctx.currentUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "post can only be deleted by the author",
        });
      }
      await ctx.prisma.post.delete({
        where: { id: input.id, authorId: ctx.currentUserId },
      });
    }),
});
