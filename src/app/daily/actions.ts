"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Profile } from "@/types/database";

// ============================================
// 출석 체크 Server Action
// ============================================
export async function checkIn(): Promise<{
  success: boolean;
  message: string;
  goldEarned?: number;
  bonusGold?: number;
  streakDay?: number;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 1. 현재 유저 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  // 2. 프로필 조회
  const { data: profileData, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    return { success: false, message: "프로필을 찾을 수 없습니다." };
  }

  const profile = profileData as Profile;

  // 3. 4시간 경과 여부 체크
  const lastCheckin = profile.last_checkin_at ? new Date(profile.last_checkin_at) : null;
  const now = new Date();
  const hoursSinceLastCheckin = lastCheckin
    ? (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60)
    : 999;

  if (hoursSinceLastCheckin < 4) {
    const remainingHours = Math.ceil(4 - hoursSinceLastCheckin);
    return {
      success: false,
      message: `아직 출석할 수 없습니다. ${remainingHours}시간 후에 다시 시도해주세요.`,
    };
  }

  // 4. 오늘 날짜 확인 (한국 시간 기준)
  const todayKST = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const isNewDay = profile.today_date !== todayKST;

  // 5. 연속 출석 계산
  let streakDay = isNewDay ? 1 : (profile.today_checkin_count ?? 0) + 1;

  // 7일 넘으면 리셋
  if (streakDay > 7) {
    streakDay = 1;
  }

  // 6. 기본 보상 계산 (5~10만 골드 랜덤)
  const baseGold = Math.floor(Math.random() * 50001) + 50000; // 50,000 ~ 100,000

  // 7. 보너스 보상 계산
  let bonusGold = 0;
  if (streakDay === 5) {
    bonusGold = 300000; // 5일 출석 30만 골드
  } else if (streakDay === 7) {
    bonusGold = 700000; // 7일 출석 70만 골드
  }

  const totalGold = baseGold + bonusGold;

  // 8. DB 업데이트
  const { error: updateError } = await db
    .from("profiles")
    .update({
      gold: profile.gold + totalGold,
      last_checkin_at: now.toISOString(),
      today_checkin_count: streakDay,
      today_checkin_gold: isNewDay ? totalGold : (profile.today_checkin_gold ?? 0) + totalGold,
      today_date: todayKST,
    })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, message: "출석 처리 중 오류가 발생했습니다." };
  }

  // 9. 출석 로그 기록
  await db.from("checkin_logs").insert({
    user_id: user.id,
    reward_gold: totalGold,
  });

  // 10. 페이지 새로고침
  revalidatePath("/daily");
  revalidatePath("/");
  revalidatePath("/profile");

  // 11. 결과 반환
  let message = `출석 완료! ${baseGold.toLocaleString()}G 획득!`;
  if (bonusGold > 0) {
    message += ` (${streakDay}일 연속 보너스 +${bonusGold.toLocaleString()}G)`;
  }

  return {
    success: true,
    message,
    goldEarned: baseGold,
    bonusGold,
    streakDay,
  };
}
