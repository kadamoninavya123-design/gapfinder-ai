import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";

async function Content() {
  const session = (await cookies()).get("gf_session");
  if (!session) redirect("/login");

  return (
    <>
      <h1 className="text-2xl font-bold">GapFinder dashboard</h1>
      <p className="text-slate-400">
        Upload your material, map the topics, then take a quiz written from your own notes.
      </p>
      <Shell />
    </>
  );
}

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#0d1320] p-6 text-white md:p-8">
      <div className="mx-auto max-w-4xl">
        <Suspense fallback={<p className="text-slate-400">Loading...</p>}>
          <Content />
        </Suspense>
      </div>
    </main>
  );
}