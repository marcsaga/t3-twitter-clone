import { Fragment } from "react";

interface OrderedItemsCardProps {
  description: string;
  itemType: string;
  items: { id: string; label: string; count: number }[];
}

export const OrderedListCard = ({
  description,
  itemType,
  items,
}: OrderedItemsCardProps) => {
  return (
    <div className="flex h-min flex-col gap-2 rounded-md bg-slate-700 px-6 py-4">
      <h2 className="text-lg">{description}</h2>
      <dl className="mt-4 grid grid-cols-[auto_2fr_auto] gap-x-5 gap-y-2">
        <dt className="text-sm font-thin text-slate-300">Rank</dt>
        <dd className="text-center text-sm font-light text-slate-300">
          {itemType}
        </dd>
        <dd className="text-center text-sm font-light text-slate-300">Count</dd>
        <hr className="col-span-3 mb-1" />
        {items.map((item, index) => (
          <Fragment key={index}>
            <dt className="text-sm font-thin text-slate-300 transition-all">
              {index + 1}.
            </dt>
            <dd className="overflow-hidden text-ellipsis whitespace-nowrap text-center">
              {item.label}
            </dd>
            <dd className="text-center text-slate-300">
              {item.count}
              {index === 0 ? "  🏆" : ""}
            </dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
};
