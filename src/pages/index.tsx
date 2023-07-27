import { SignInButton, useUser } from "@clerk/nextjs";
import { api } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import { Feed } from "~/components/feed";
import { Avatar } from "~/components/avatar";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "~/components/loading";
import { PageLayout } from "~/components/layout";

const isEmoji = z.string().emoji();
dayjs.extend(relativeTime);

function CreatePostWizard() {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const ctx = api.useContext();
  const { mutate, isLoading: isCreating } = api.posts.create.useMutation({
    onSuccess: () => void ctx.posts.getAll.invalidate(),
    onError: (error) => {
      const errorMessage = error.data?.zodError?.fieldErrors.content?.[0];
      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error("Something went wrong");
      }
    },
  });

  if (!user) return null;

  return (
    <form
      className="flex gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isEmoji.safeParse(input).success) {
          toast.error("Invalid emoji");
        } else {
          mutate({ content: input });
        }
        setInput("");
      }}
    >
      <Avatar src={user.profileImageUrl} author={user.fullName ?? ""} />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {!isCreating && input !== "" && (
        <button>
          <span>Post</span>
        </button>
      )}
      {isCreating && <LoadingSpinner />}
    </form>
  );
}

export default function Home() {
  const { user, isSignedIn, isLoaded } = useUser();

  // start fetching asap
  api.posts.getAll.useQuery({});

  if (!isLoaded) return <div />;

  return (
    <PageLayout>
      <div className="flex flex-col gap-8 border-b border-slate-400 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium">Twitter t3</h1>
          {isSignedIn && (
            <span className="font-extralight">Hello @{user?.username}</span>
          )}
        </div>
        {!isSignedIn ? <SignInButton /> : <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout>
  );
}
