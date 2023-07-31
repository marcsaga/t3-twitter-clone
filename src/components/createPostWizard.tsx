import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
} from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { Avatar } from "./avatar";
import { LoadingSpinner } from "./loading";

const formSchema = z.object({
  content: z.string().emoji().min(1).max(250),
});

interface NewPost {
  content: string;
}

export function CreatePostWizard() {
  const { user } = useUser();
  const {
    handleSubmit,
    register,
    formState: { isValid },
    reset,
  } = useForm<NewPost>({ resolver: zodResolver(formSchema) });
  const ctx = api.useContext();
  const { mutate, isLoading: isCreating } = api.posts.create.useMutation({
    onSuccess: () => {
      void ctx.posts.getAll.invalidate();
      void ctx.posts.getAllByUserId.invalidate({ userId: user?.id });
      void ctx.posts.getMostUsedEmojis.invalidate();
      void ctx.posts.getMostUsedEmojisByUserId.invalidate();
      void ctx.posts.getMostActiveUsers.invalidate();
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
      {isValid && !isCreating && (
        <button>
          <span>Post</span>
        </button>
      )}
      {isCreating && <LoadingSpinner />}
    </form>
  );
}
