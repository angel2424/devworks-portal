import React from "react"
import Link from "next/link"

const StatCard = ({
  label,
  value,
  sublabel,
  accent,
  warning,
  href,
}: {
  label: string
  value: string | number
  sublabel: string
  accent?: boolean
  warning?: boolean
  href?: string
}) => {
  const bg = accent
    ? "border-brand-100"
    : warning
      ? "border-red-200"
      : "bg-transparent border-gray-300"

  const valueColor = accent
    ? "text-brand-600"
    : warning
      ? "text-red-600"
      : "text-gray-900"

  const color = accent
    ? "text-brand-600"
    : warning
      ? "text-red-700"
      : "text-gray-500"

  const card = (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-5 ${bg} ${href ? "transition-shadow hover:shadow-sm" : ""}`}
    >
      <p className={`text-base font-medium ${color}`}>{label}</p>
      <p className={`font-heading text-3xl font-semibold ${valueColor}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{sublabel}</p>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}

export default StatCard
