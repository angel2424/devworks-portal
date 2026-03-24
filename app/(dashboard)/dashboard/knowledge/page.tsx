import { KBBrowser } from "@/components/knowledge/kb-browser";

export const metadata = {
  title: "Knowledge Base — DevWorks",
};

/**
 * Knowledge Base page.
 *
 * This is intentionally a thin RSC shell — all data fetching and state
 * management happen inside <KBBrowser> (client component) so that:
 *   1. The UI can fall back to IndexedDB when offline.
 *   2. Autosave works without full-page navigation.
 */
export default function KnowledgePage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex-shrink-0">
        <h1 className="font-heading text-2xl font-semibold text-gray-900 leading-none mb-1">
          Knowledge Base
        </h1>
        <p className="text-sm text-gray-500">
          Documentación y notas del equipo. Disponible sin conexión.
        </p>
      </div>

      {/* Browser fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <KBBrowser />
      </div>
    </div>
  );
}
