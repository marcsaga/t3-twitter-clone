import { type PropsWithChildren } from "react";

interface PageLayoutProps extends PropsWithChildren {
  rightContent?: React.ReactElement[];
  leftContent?: React.ReactElement[];
}

export const PageLayout = (props: PageLayoutProps) => {
  return (
    <main className="flex h-screen justify-center">
      <div className="relative grid w-full grid-cols-1 md:grid-cols-[1fr_minmax(auto,_750px)_1fr]">
        <div className="hidden md:block">{props.leftContent}</div>
        <div className="h-full overflow-y-auto border-x">{props.children}</div>
        <div className="mt-16 hidden h-min w-72 flex-col justify-center gap-6 p-6 md:flex lg:w-96">
          {props.rightContent}
        </div>
      </div>
    </main>
  );
};
