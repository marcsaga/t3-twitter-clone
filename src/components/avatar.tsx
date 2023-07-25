import Image from "next/image";

export function Avatar(props: { src: string; author?: string }) {
  return (
    <Image
      className="h-8 w-8 rounded-full"
      src={props.src}
      alt={`${props.author} profile image`}
      height="32"
      width="32"
    />
  );
}
