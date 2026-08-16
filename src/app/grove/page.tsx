import { redirect } from "next/navigation";

/**
 * The Grove was absorbed into the Journal tab. Old links/bookmarks land
 * here and get sent straight to its new home.
 */
export default function GrovePage() {
  redirect("/journal");
}
