import { redirect } from "next/navigation";

// No public sign-ups — access is by invite only.
export default function Page() {
  redirect("/login");
}
