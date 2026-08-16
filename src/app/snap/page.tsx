import { redirect } from "next/navigation";

// The 9-step /daily loop is now the only camera flow (Living Sandbox spec).
// /snap stays mounted so old links/bookmarks still land somewhere useful.
export default function SnapPage() {
  redirect("/daily");
}
