import { redirect } from "next/navigation";

// The collection is the starting point, not a second, outdated dashboard.
export default function StudioHome() {
  redirect("/gallery/best-of");
}
