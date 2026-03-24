import React from 'react'

const StatCard = ({
    label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  accent?: boolean;
}) => {
  return (
        <div className={`
      rounded-xl border p-5 flex flex-col gap-3
      ${accent
        ? "bg-brand-50 border-brand-200"
        : "bg-white border-gray-200"
      }
    `}>
      <p className="text-base text-gray-500 font-normal">{label}</p>
      <p className={`font-heading text-3xl font-semibold ${accent ? "text-brand-600" : "text-gray-900"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{sublabel}</p>
    </div>
  )
}

export default StatCard
