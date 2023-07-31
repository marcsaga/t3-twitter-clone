import { SignInButton, useUser, SignOutButton } from "@clerk/nextjs";
import { api } from "~/utils/api";
import { Feed } from "~/components/feed";
import { PageLayout } from "~/components/layout";
import Link from "next/link";
import { CreatePostWizard } from "~/components/createPostWizard";
import { OrderedListCard } from "~/components/orderedList";

const TopEmojisPostedCard = () => {
  const { data } = api.posts.getMostUsedEmojis.useQuery();

  if (data === undefined) return null;

  return (
    <OrderedListCard
      description="Top Emojis Used"
      itemType="Emojis"
      items={
        data?.map(({ emoji: label, count }) => ({ id: label, label, count })) ??
        []
      }
    />
  );
};

const TopActiveUsersCard = () => {
  const { data } = api.posts.getMostActiveUsers.useQuery();

  if (data === undefined) return null;

  return (
    <OrderedListCard
      description="Top Active Users"
      itemType="Posts"
      items={
        data?.map(({ authorId, authorName, count }) => ({
          id: authorId,
          label: authorName,
          count,
        })) ?? []
      }
    />
  );
};

export default function Home() {
  const { user, isSignedIn, isLoaded } = useUser();

  // start fetching asap
  api.posts.getAll.useQuery();

  if (!isLoaded) return <div />;

  return (
    <PageLayout
      rightContent={[
        <TopEmojisPostedCard key="top-emojis" />,
        <TopActiveUsersCard key="top-active-users" />,
      ]}
    >
      <div className="flex flex-col gap-8 border-b border-slate-400 p-4">
        {isSignedIn && user && (
          <div className="flex items-center justify-between">
            <span className="text-xl font-extralight">
              Hello <Link href={`/@${user?.username}`}>@{user?.username}</Link>
            </span>
            <SignOutButton>
              <button title="sign out" className="ml-3">
                <span className="text-xl">🚪</span>
              </button>
            </SignOutButton>
          </div>
        )}
        {!isSignedIn ? <SignInButton /> : <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout>
  );
}
