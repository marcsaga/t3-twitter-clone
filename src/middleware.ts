import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/api/trpc/posts.getAll",
    "/api/trpc/posts.getAllByUserId,posts.getMostUsedEmojisByUserId,profile.getUserByUsername",
    "/api/trpc/posts.getMostUsedEmojis,posts.getMostActiveUsers",
    "/@:username",
  ],
});

export const config = {
  matcher: ["/((?!_next/image|_next/static|favicon.ico).*)"],
};
