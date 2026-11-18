import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const okEmail = process.env.DEMO_EMAIL ?? "demo@gapfinder.ai";
  const okPass = process.env.DEMO_PASSWORD ?? "demo1234";

  if (email === okEmail && password === okPass) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("gf_session", "demo-student", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return res;
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}