import { redirect } from "next/navigation";

/** The Fixex dashboard is the entry point; the old metrics page is out of the routes. */
export default function RootPage() {
  redirect("/fixex");
}