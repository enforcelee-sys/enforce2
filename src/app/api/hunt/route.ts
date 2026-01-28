// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 보상 타입
type RewardType = "GOLD" | "KEY" | "PROTECTION_LOW" | "PROTECTION_MID" | "PROTECTION_HIGH";

interface HuntResult {
  success: boolean;
  rewardType: RewardType;
  rewardAmount: number;
  message: string;
  newKeys?: number;
  newLevel?: number;
  levelUp?: boolean;
}

// 레벨별 파괴방지권 드랍 확률
function getProtectionDropRates(level: number): { type: RewardType; chance: number }[] {
  if (level >= 1 && level <= 5) {
    return [{ type: "PROTECTION_LOW", chance: 5 }];
  } else if (level >= 6 && level <= 10) {
    return [
      { type: "PROTECTION_LOW", chance: 3 },
      { type: "PROTECTION_MID", chance: 2 },
    ];
  } else if (level >= 11 && level <= 15) {
    return [
      { type: "PROTECTION_LOW", chance: 2 },
      { type: "PROTECTION_MID", chance: 2 },
      { type: "PROTECTION_HIGH", chance: 1 },
    ];
  } else {
    // 16~20
    return [
      { type: "PROTECTION_MID", chance: 3 },
      { type: "PROTECTION_HIGH", chance: 2 },
    ];
  }
}

// 보상 계산
function calculateReward(level: number): { type: RewardType; amount: number } {
  const roll = Math.random() * 100;

  // 1~10레벨: 열쇠 10%, 파괴방지권 5%, 골드 85%
  // 11~20레벨: 열쇠 5%, 파괴방지권 5%, 골드 90%
  const keyChance = level <= 10 ? 10 : 5;
  const protectionChance = 5;
  const goldChance = 100 - keyChance - protectionChance;

  // 골드
  if (roll < goldChance) {
    // 곡선형 증가: 1레벨 1,000G → 20레벨 100,000G
    // 공식: 1000 * (100)^((level-1)/19)
    const baseGold = Math.floor(1000 * Math.pow(100, (level - 1) / 19));
    // +-10% 범위
    const minGold = Math.floor(baseGold * 0.9);
    const maxGold = Math.floor(baseGold * 1.1);
    const gold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
    return { type: "GOLD", amount: gold };
  }

  // 열쇠
  if (roll < goldChance + keyChance) {
    return { type: "KEY", amount: 1 };
  }

  // 파괴방지권
  const protectionRates = getProtectionDropRates(level);
  const totalProtectionChance = protectionRates.reduce((sum, p) => sum + p.chance, 0);
  let protectionRoll = Math.random() * totalProtectionChance;

  for (const protection of protectionRates) {
    if (protectionRoll < protection.chance) {
      return { type: protection.type, amount: 1 };
    }
    protectionRoll -= protection.chance;
  }

  // fallback
  return { type: protectionRates[0].type, amount: 1 };
}

// 보상 타입 한글 변환
function getRewardName(type: RewardType): string {
  switch (type) {
    case "GOLD": return "골드";
    case "KEY": return "열쇠";
    case "PROTECTION_LOW": return "하급 파괴방지권";
    case "PROTECTION_MID": return "중급 파괴방지권";
    case "PROTECTION_HIGH": return "고급 파괴방지권";
  }
}

export async function POST() {
  const supabase = await createClient();

  try {
    // 유저 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 프로필 조회
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("current_hunting_level, hunting_keys, is_hunting, hunting_started_at, gold, protection_low, protection_mid, protection_high")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json({ error: "프로필을 찾을 수 없습니다" }, { status: 404 });
    }

    const profile = profileData as {
      current_hunting_level: number;
      hunting_keys: number;
      is_hunting: boolean;
      hunting_started_at: string | null;
      gold: number;
      protection_low: number;
      protection_mid: number;
      protection_high: number;
    };

    // 이미 사냥 중인지 확인
    if (profile.is_hunting && profile.hunting_started_at) {
      const startedAt = new Date(profile.hunting_started_at);
      const elapsed = Date.now() - startedAt.getTime();

      // 5초 미경과
      if (elapsed < 5000) {
        const remaining = Math.ceil((5000 - elapsed) / 1000);
        return NextResponse.json({
          error: `사냥 중입니다. ${remaining}초 남음`,
          isHunting: true,
          remainingSeconds: remaining
        }, { status: 400 });
      }
    }

    const currentLevel = profile.current_hunting_level ?? 1;

    // 보상 계산
    const reward = calculateReward(currentLevel);

    // 업데이트할 데이터 준비
    const updates: Record<string, unknown> = {
      is_hunting: false,
      hunting_started_at: null,
    };

    let levelUp = false;
    let newKeys = profile.hunting_keys ?? 0;
    let newLevel = currentLevel;

    switch (reward.type) {
      case "GOLD":
        updates.gold = (profile.gold ?? 0) + reward.amount;
        break;
      case "KEY":
        newKeys += 1;
        // 열쇠 3개 모으면 다음 레벨 해금
        if (newKeys >= 3 && currentLevel < 20) {
          newLevel = currentLevel + 1;
          newKeys = 0;
          levelUp = true;
        }
        updates.hunting_keys = newKeys;
        updates.current_hunting_level = newLevel;
        break;
      case "PROTECTION_LOW":
        updates.protection_low = (profile.protection_low ?? 0) + 1;
        break;
      case "PROTECTION_MID":
        updates.protection_mid = (profile.protection_mid ?? 0) + 1;
        break;
      case "PROTECTION_HIGH":
        updates.protection_high = (profile.protection_high ?? 0) + 1;
        break;
    }

    // 프로필 업데이트
    // @ts-ignore - Supabase types not generated
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: "보상 지급 실패" }, { status: 500 });
    }

    // 사냥 로그 기록
    // @ts-ignore - Supabase types not generated
    await supabase.from("hunting_logs").insert({
      user_id: user.id,
      hunting_level: currentLevel,
      reward_type: reward.type,
      reward_amount: reward.amount,
    });

    const result: HuntResult = {
      success: true,
      rewardType: reward.type,
      rewardAmount: reward.amount,
      message: `${getRewardName(reward.type)} ${reward.amount.toLocaleString()}${reward.type === "GOLD" ? "G" : "개"} 획득!`,
      newKeys,
      newLevel,
      levelUp,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Hunt error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 사냥 시작 (5초 타이머)
export async function PUT() {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 프로필 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_hunting, hunting_started_at")
      .eq("id", user.id)
      .single();

    // 이미 사냥 중인지 확인
    if (profile?.is_hunting && profile.hunting_started_at) {
      const startedAt = new Date(profile.hunting_started_at);
      const elapsed = Date.now() - startedAt.getTime();

      if (elapsed < 5000) {
        return NextResponse.json({
          error: "이미 사냥 중입니다",
          isHunting: true
        }, { status: 400 });
      }
    }

    // 사냥 시작
    // @ts-ignore - Supabase types not generated
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_hunting: true,
        hunting_started_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "사냥 시작 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "사냥 시작!" });
  } catch (error) {
    console.error("Hunt start error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
