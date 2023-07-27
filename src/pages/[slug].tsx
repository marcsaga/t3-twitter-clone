import Head from "next/head";
import { api } from "~/utils/api";

export const UserProfile = (props: { username: string; color: string }) => {
  // start fetching asap

  const { data } = api.profile.getUserByUsername.useQuery({
    username: props.username,
  });

  const user = data?.user;

  if (!user) return <div>Something went wrong...</div>;

  return (
    <>
      <Head>
        <title>Twitter Profile</title>
      </Head>
      <PageLayout>
        <div className="flex flex-col">
          <div className={`${props.color} relative h-36`}>
            <div
              className={`absolute -bottom-10 left-4 ${props.color} rounded-full p-1`}
            >
              <Avatar
                size="medium"
                src={user.profileImageUrl}
                author={props.username}
              />
            </div>
          </div>
          <div className="border-b border-slate-400 pb-4 pl-4 pt-14">
            <h1 className="text-xl font-medium">@{props.username}</h1>
          </div>
        </div>
        <Feed />
      </PageLayout>
    </>
  );
};

export default UserProfile;

import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";
import { type GetStaticProps } from "next";
import { PageLayout } from "~/components/layout";
import { Avatar } from "~/components/avatar";
import { Feed } from "~/components/feed";

const colors = [
  "bg-cyan-700",
  "bg-indigo-700",
  "bg-emerald-700",
  "bg-yellow-700",
  "bg-orange-700",
];

function generateColorFromString(str: string) {
  const sum = str
    .split("")
    .map((char) => char.charCodeAt(0))
    .reduce((acc, curr) => acc + curr, 0);

  return colors[sum % colors.length];
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma: prisma, currentUserId: null },
    transformer: superjson, // optional - adds superjson serialization
  });
  const slug = context.params?.slug;
  if (typeof slug !== "string") {
    throw new Error("invalid slug");
  }
  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
      color: generateColorFromString(username),
    },
    revalidate: 30,
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};
