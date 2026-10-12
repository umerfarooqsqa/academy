import { cookies } from "next/headers";
import AdminNav from "@/app/components/AdminNav";
import { pageWrap } from "@/app/components/ui";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav role={session?.role ?? "staff"} />
      <div className={pageWrap}>{children}</div>
    </div>
  );
}
