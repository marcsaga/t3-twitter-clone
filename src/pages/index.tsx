import { SignInButton, useUser, SignOutButton } from "@clerk/nextjs";
import { api } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Feed } from "~/components/feed";
import { Avatar } from "~/components/avatar";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "~/components/loading";
import { PageLayout } from "~/components/layout";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

dayjs.extend(relativeTime);

const formSchema = z.object({
  content: z.string().emoji(),
});

interface NewPost {
  content: string;
}

function CreatePostWizard() {
  const { user } = useUser();
  const {
    handleSubmit,
    register,
    formState: { errors, isValid },
    reset,
  } = useForm<NewPost>({ resolver: zodResolver(formSchema) });
  const ctx = api.useContext();
  const { mutate, isLoading: isCreating } = api.posts.create.useMutation({
    onSuccess: () => {
      void ctx.posts.getAll.invalidate();
      reset();
    },
    onError: (error) => {
      const errorMessage = error.data?.zodError?.fieldErrors.content?.[0];
      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error("Something went wrong");
      }
    },
  });

  const onSubmit: SubmitHandler<NewPost> = (data, event) => {
    event?.preventDefault();
    mutate(data);
  };

  const onInvalid: SubmitErrorHandler<NewPost> = (errors) => {
    toast.error(errors.content?.message ?? "Something went wrong");
  };

  if (!user) return null;

  return (
    <form className="flex gap-3" onSubmit={handleSubmit(onSubmit, onInvalid)}>
      <Avatar src={user.profileImageUrl} author={user.fullName ?? ""} />
      <input
        {...register("content", { required: true })}
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
      />
      {isValid && (
        <button disabled={errors.content === undefined}>
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
  api.posts.getAll.useQuery();

  if (!isLoaded) return <div />;

  return (
    <PageLayout>
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
