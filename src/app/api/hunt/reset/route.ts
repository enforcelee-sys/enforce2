import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 사냥 상태 강제 리셋 (stuck 방지)
export async function POST() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  // @ts-expect-error - Supabase types not generated
  await supabase
    .from("profiles")
    .update({ is_hunting: false, hunting_started_at: null })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
