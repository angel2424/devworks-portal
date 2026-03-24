import { redirect } from "next/navigation";

// The root always redirects — middleware handles auth-based routing.
// Unauthenticated users → /login
// Team users           → /dashboard
// Client users         → /portal
export default function RootPage() {
  redirect("/login");
}
