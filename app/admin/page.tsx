// /admin isn't a page of its own — the dashboard lives at /dashboard. People
// naturally type /admin, which used to end in a 404 right after logging in
// (middleware sends them to /login?next=/admin, then back to /admin). This
// just forwards them; the middleware still requires a login first.

import { redirect } from "next/navigation";

export default function AdminRedirect() {
  redirect("/dashboard");
}
