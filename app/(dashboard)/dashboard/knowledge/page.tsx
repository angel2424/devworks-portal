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
      <KBBrowser />
    </div>
  );
}
