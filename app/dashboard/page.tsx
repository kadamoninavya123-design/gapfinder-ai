import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function Content() {
  const session = (await cookies()).get("gf_session");
  if (!session) redirect("/login");

  return (
    <>
      <h1 className="text-2xl font-bold">GapFinder dashboard</h1>
      <p className="text-slate-400">Logged in as the demo student.</p>
    </>
  );
}

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#0d1320] text-white p-8">
      <Suspense fallback={<p className="text-slate-400">Loading...</p>}>
        <Content />
      </Suspense>
    </main>
  );
}