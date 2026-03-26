export default function QuickAction({
  label,
  description,
  href,
  icon,
}: {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex flex-1 items-center gap-4 p-4 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all group"
    >
      <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </a>
  );
}
