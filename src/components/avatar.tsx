import Image from "next/image";

type Size = "small" | "medium" | "large";

const sizes: Record<Size, string> = {
  small: "h-8 w-8",
  medium: "h-20 w-20",
  large: "h-32 w-32",
};

interface AvatarProps {
  src: string;
  author?: string;
  size?: Size;
}

export const Avatar = (props: AvatarProps) => {
  return (
    <Image
      className={`${sizes[props.size ?? "small"]} rounded-full`}
      src={props.src}
      alt={`${props.author} profile image`}
      height="32"
      width="32"
    />
  );
};
