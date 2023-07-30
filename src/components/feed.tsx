import { type RouterOutputs, api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "./loading";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Avatar } from "./avatar";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

dayjs.extend(relativeTime);

type PostWithAuthor = RouterOutputs["posts"]["getAll"][number];
export function PostView({ author, ...post }: PostWithAuthor) {
  const { user } = useUser();
  const ctx = api.useContext();
  const { mutate, isLoading: deletingPost } = api.posts.delete.useMutation({
    onSuccess: () => {
      void ctx.posts.getAll.invalidate();
      void ctx.posts.getAllByUserId.invalidate({ userId: author.id });
    },
  });

  return (
    <div className="flex items-center gap-4 border-b border-slate-400 p-4">
      <Link href={`/@${author.username}`}>
        <Avatar src={author.profileImageUrl} author={author.username ?? ""} />
      </Link>
      <div className="flex grow flex-col gap-1">
        <div className="flex justify-between gap-1 text-slate-200">
          <Link href={`/@${author.username}`}>
            <div className="flex items-center gap-1">
              <span>{`@${author.username}`}</span>
              <span>·</span>
              <span className="text-xs font-thin">
                {dayjs(post.createdAt).fromNow()}
              </span>
            </div>
          </Link>
          {!deletingPost && author.id === user?.id && (
            <button onClick={() => mutate({ id: post.id })}>
              <span>🗑️</span>
            </button>
          )}
          {deletingPost && <LoadingSpinner height={16} width={16} />}
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
    </div>
  );
}

function getPosts(userId?: string) {
  if (userId) {
    return api.posts.getAllByUserId.useQuery({ userId });
  }
  return api.posts.getAll.useQuery();
}

interface ProfileFeedProps {
  userId?: string;
}

export function Feed(props: ProfileFeedProps) {
  const { data, isLoading } = getPosts(props.userId);

  if (isLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong...</div>;

  return (
    <div className="flex flex-col">
      {data.length === 0 && (
        <div className="flex justify-center pt-10">
          <p className="text-sm">No posts yet</p>
        </div>
      )}
      {data.map((post) => (
        <PostView key={post.id} {...post} />
      ))}
    </div>
  );
}
