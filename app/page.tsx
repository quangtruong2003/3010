import { cookies } from "next/headers";
import { verifySession, sessionCookieName } from "@/lib/session";
import { anniversary } from "@/lib/anniversary-data";
import LockScreen from "@/components/lock-screen";
import AnniversaryPage from "@/components/anniversary-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const jar = await cookies();
  const unlocked = verifySession(jar.get(sessionCookieName)?.value);

  if (!unlocked) return <LockScreen data={anniversary} />;
  return <AnniversaryPage data={anniversary} />;
}