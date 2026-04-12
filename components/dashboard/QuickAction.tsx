export default function QuickAction({
  label,
  description,
  href,
  icon,
}: {
  label: string
  description: string
  href: string
  icon: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={`group flex w-full flex-1 items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:bg-gray-50`}
    >
      <div className="group-hover:text-brand-500 group-hover:bg-brand-50 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 transition-colors group-hover:text-gray-900">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{description}</p>
      </div>
    </a>
  )
}
