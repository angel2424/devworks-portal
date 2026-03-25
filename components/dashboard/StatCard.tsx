import React from 'react'
import Link from "next/link";

const StatCard = ({
  label,
  value,
  sublabel,
  accent,
  warning,
  href,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  accent?: boolean;
  warning?: boolean;
  href?: string;
}) => {
  const bg = accent
    ? "bg-brand-50 border-brand-200"
    : warning
    ? "bg-amber-50 border-amber-200"
    : "bg-white border-gray-200";

  const valueColor = accent
    ? "text-brand-600"
    : warning
    ? "text-amber-600"
    : "text-gray-900";

  const card = (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${bg} ${href ? "transition-shadow hover:shadow-sm" : ""}`}>
      <p className="text-base text-gray-500 font-normal">{label}</p>
      <p className={`font-heading text-3xl font-semibold ${valueColor}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{sublabel}</p>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{card}</Link>;
  }

  return card;
}

export default StatCard
