"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Profile } from "@/types/database";

// ============================================
// 강화 확률 테이블 (성공 / 유지 / 파괴)
// 기존 대비 성공률 10% 감소 (곱하기 0.9), 줄어든 만큼 유지에 추가
// ============================================
const UPGRADE_CHANCES: Record<number, { success: number; maintain: number; destroy: number }> = {
  0: { success: 90, maintain: 10, destroy: 0 },   // 100*0.9=90, +10 유지
  1: { success: 81, maintain: 14, destroy: 5 },   // 90*0.9=81, +9 유지
  2: { success: 77, maintain: 18, destroy: 5 },   // 85*0.9≈77, +8 유지
  3: { success: 72, maintain: 23, destroy: 5 },   // 80*0.9=72, +8 유지
  4: { success: 68, maintain: 27, destroy: 5 },   // 75*0.9≈68, +7 유지
  5: { success: 63, maintain: 32, destroy: 5 },   // 70*0.9=63, +7 유지
  6: { success: 59, maintain: 36, destroy: 5 },   // 65*0.9≈59, +6 유지
  7: { success: 54, maintain: 39, destroy: 7 },   // 60*0.9=54, +6 유지
  8: { success: 50, maintain: 40, destroy: 10 },  // 55*0.9≈50, +5 유지
  9: { success: 45, maintain: 42, destroy: 13 },  // 50*0.9=45, +5 유지
  10: { success: 32, maintain: 50, destroy: 18 }, // 35*0.9≈32, +3 유지
  11: { success: 29, maintain: 52, destroy: 19 }, // 32*0.9≈29, +3 유지
  12: { success: 26, maintain: 54, destroy: 20 }, // 29*0.9≈26, +3 유지
  13: { success: 23, maintain: 56, destroy: 21 }, // 26*0.9≈23, +3 유지
  14: { success: 21, maintain: 57, destroy: 22 }, // 23*0.9≈21, +2 유지
  15: { success: 18, maintain: 59, destroy: 23 }, // 20*0.9=18, +2 유지
  16: { success: 15, maintain: 61, destroy: 24 }, // 17*0.9≈15, +2 유지
  17: { success: 10, maintain: 70, destroy: 20 }, // 성공↓3, 파괴↓5 → 유지+8
  18: { success: 7, maintain: 73, destroy: 20 },  // 성공↓3, 파괴↓5 → 유지+8
  19: { success: 5, maintain: 75, destroy: 20 },  // 성공↓2, 파괴↓5 → 유지+7
  20: { success: 3, maintain: 77, destroy: 20 },  // 성공↓2, 파괴↓5 → 유지+7
};

// ============================================
// 강화 비용 테이블
// ============================================
const UPGRADE_COSTS: Record<number, number> = {
  0: 100,       // 0→1
  1: 200,       // 1→2
  2: 400,       // 2→3
  3: 800,       // 3→4
  4: 1600,      // 4→5
  5: 3200,      // 5→6
  6: 6000,      // 6→7
  7: 10000,     // 7→8
  8: 16000,     // 8→9
  9: 25000,     // 9→10
  10: 40000,    // 10→11
  11: 65000,    // 11→12
  12: 105000,   // 12→13
  13: 170000,   // 13→14
  14: 270000,   // 14→15
  15: 430000,   // 15→16
  16: 700000,   // 16→17
  17: 1100000,  // 17→18
  18: 1700000,  // 18→19
  19: 2600000,  // 19→20
  20: 0,        // 20강은 더 이상 강화 불가
};

// 무기 타입 목록
const WEAPON_TYPES = ["칼", "활", "지팡이", "방패", "몽둥이"];

// 무기 타입별 컨셉 목록 (CSV 데이터와 일치)
const CONCEPTS_BY_WEAPON: Record<string, string[]> = {
  "칼": ["그림자", "피", "저주", "시간", "왕권", "광기", "성전", "배신", "절단", "종말"],
  "활": ["사냥", "관통", "예언", "암살", "추적", "저격", "절멸", "운명", "삭제", "종말"],
  "지팡이": ["마력", "금단", "혼돈", "차원", "원소", "사령", "진리", "왜곡", "초월", "창조"],
  "방패": ["수호", "불굴", "반격", "요새", "심판", "지배", "침묵", "압도", "절대", "불멸"],
  "몽둥이": ["야만", "뼈", "대지", "분노", "파괴", "굶주림", "원시", "압살", "학살", "종말"],
};

// 무기 타입에 맞는 랜덤 컨셉 선택
const getRandomConcept = (weaponType: string): string => {
  const concepts = CONCEPTS_BY_WEAPON[weaponType] ?? CONCEPTS_BY_WEAPON["칼"];
  return concepts[Math.floor(Math.random() * concepts.length)];
};

// ============================================
// 닉네임 설정 Server Action
// ============================================
export async function setNickname(nickname: string): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 유저 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  // 닉네임 유효성 검사
  const trimmedNickname = nickname.trim();
  if (trimmedNickname.length < 1 || trimmedNickname.length > 6) {
    return { success: false, message: "닉네임은 1~6자 사이로 입력해주세요." };
  }

  // 특수문자 검사 (한글, 영문, 숫자만 허용)
  const nicknameRegex = /^[가-힣a-zA-Z0-9]+$/;
  if (!nicknameRegex.test(trimmedNickname)) {
    return { success: false, message: "닉네임은 한글, 영문, 숫자만 사용 가능합니다." };
  }

  // 중복 검사
  const { data: existingUser } = await db
    .from("profiles")
    .select("id")
    .eq("nickname", trimmedNickname)
    .neq("id", user.id)
    .single();

  if (existingUser) {
    return { success: false, message: "이미 사용 중인 닉네임입니다." };
  }

  // 닉네임 업데이트
  const { error } = await db
    .from("profiles")
    .update({ nickname: trimmedNickname })
    .eq("id", user.id);

  if (error) {
    return { success: false, message: "닉네임 설정에 실패했습니다." };
  }

  revalidatePath("/");
  revalidatePath("/upgrade");

  return { success: true, message: "닉네임이 설정되었습니다!" };
}

// ============================================
// 강화 시도 Server Action
// ============================================
export async function attemptUpgrade(
  protection: "low" | "mid" | "high" | null = null
): Promise<{
  success: boolean;
  result?: "SUCCESS" | "MAINTAIN" | "DESTROY";
  message: string;
  newLevel?: number;
  goldSpent?: number;
  newWeaponName?: string;
  newWeaponDescription?: string | null;
  newWeaponType?: string;
  usedProtection?: string;
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
  const currentLevel = profile.weapon_level;

  // 3. 20강이면 강화 불가
  if (currentLevel >= 20) {
    return { success: false, message: "이미 최고 강화 단계입니다!" };
  }

  // 4. 파괴 방지권 유효성 검사
  let useProtection = false;
  if (protection) {
    if (protection === "low") {
      if (profile.protection_low <= 0) {
        return { success: false, message: "파괴 방지권 (하)가 부족합니다." };
      }
      if (currentLevel > 10) {
        return { success: false, message: "파괴 방지권 (하)는 10강 이하에서만 사용 가능합니다." };
      }
      useProtection = true;
    } else if (protection === "mid") {
      if (profile.protection_mid <= 0) {
        return { success: false, message: "파괴 방지권 (중)이 부족합니다." };
      }
      if (currentLevel > 15) {
        return { success: false, message: "파괴 방지권 (중)은 15강 이하에서만 사용 가능합니다." };
      }
      useProtection = true;
    } else if (protection === "high") {
      if (profile.protection_high <= 0) {
        return { success: false, message: "파괴 방지권 (상)이 부족합니다." };
      }
      if (currentLevel < 15) {
        return { success: false, message: "파괴 방지권 (상)은 15강 이상에서만 사용 가능합니다." };
      }
      useProtection = true;
    }
  }

  // 5. 강화 비용 확인
  const cost = UPGRADE_COSTS[currentLevel];
  if (profile.gold < cost) {
    return { success: false, message: `골드가 부족합니다. (필요: ${cost.toLocaleString()}G)` };
  }

  // 6. 확률 계산
  const chances = UPGRADE_CHANCES[currentLevel];
  const roll = Math.random() * 100;

  let result: "SUCCESS" | "MAINTAIN" | "DESTROY";
  let newLevel: number;
  let newWeaponType = profile.weapon_type;
  let newWeaponConcept = profile.weapon_concept;

  if (roll < chances.success) {
    // 성공: +1
    result = "SUCCESS";
    newLevel = currentLevel + 1;
  } else if (roll < chances.success + chances.maintain) {
    // 유지: 변화 없음
    result = "MAINTAIN";
    newLevel = currentLevel;
  } else {
    // 파괴 판정
    if (useProtection) {
      // 파괴 방지권 사용 시
      if (protection === "high") {
        // 고급: -1강
        result = "MAINTAIN";
        newLevel = Math.max(0, currentLevel - 1);
      } else {
        // 하급/중급: 유지
        result = "MAINTAIN";
        newLevel = currentLevel;
      }
    } else {
      // 파괴: 0강 + 랜덤 무기
      result = "DESTROY";
      newLevel = 0;
      newWeaponType = WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
      newWeaponConcept = getRandomConcept(newWeaponType);
    }
  }

  // 6. 무기별 최고 레벨 계산
  const getBestLevelField = (weaponType: string) => {
    switch (weaponType) {
      case "칼": return "best_sword_level";
      case "활": return "best_bow_level";
      case "지팡이": return "best_staff_level";
      case "방패": return "best_shield_level";
      case "몽둥이": return "best_club_level";
      default: return null;
    }
  };

  const bestLevelField = getBestLevelField(profile.weapon_type);
  const currentBestLevel = bestLevelField ? (profile as Record<string, number>)[bestLevelField] ?? 0 : 0;
  const shouldUpdateBest = result === "SUCCESS" && newLevel > currentBestLevel;

  // 7. DB 업데이트 (골드 차감 + 레벨 변경)
  const updateData: Record<string, unknown> = {
    gold: profile.gold - cost,
    weapon_level: newLevel,
    weapon_type: newWeaponType,
    weapon_concept: newWeaponConcept,
    // 통계 업데이트
    total_upgrades: profile.total_upgrades + 1,
    total_successes: result === "SUCCESS" ? profile.total_successes + 1 : profile.total_successes,
    total_maintains: result === "MAINTAIN" ? profile.total_maintains + 1 : profile.total_maintains,
    total_destroys: result === "DESTROY" ? profile.total_destroys + 1 : profile.total_destroys,
    // 연속 성공 기록
    current_success_streak: result === "SUCCESS" ? profile.current_success_streak + 1 : 0,
    max_success_streak: result === "SUCCESS"
      ? Math.max(profile.max_success_streak, profile.current_success_streak + 1)
      : profile.max_success_streak,
  };

  // 무기별 최고 레벨 업데이트
  if (shouldUpdateBest && bestLevelField) {
    updateData[bestLevelField] = newLevel;
  }

  // 파괴 방지권 소모
  if (useProtection && protection) {
    if (protection === "low") {
      updateData.protection_low = profile.protection_low - 1;
    } else if (protection === "mid") {
      updateData.protection_mid = profile.protection_mid - 1;
    } else if (protection === "high") {
      updateData.protection_high = profile.protection_high - 1;
    }
  }

  const { error: updateError } = await db
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (updateError) {
    return { success: false, message: "강화 처리 중 오류가 발생했습니다." };
  }

  // 7. 강화 로그 기록 (이전 무기 정보)
  const { data: oldWeaponInfo } = await db
    .from("weapon_descriptions")
    .select("name, description")
    .eq("weapon_type", profile.weapon_type)
    .eq("concept", profile.weapon_concept)
    .eq("level", currentLevel)
    .single();

  const { error: logError } = await db.from("upgrade_logs").insert({
    user_id: user.id,
    nickname: profile.nickname,
    action: "UPGRADE",
    weapon_type: profile.weapon_type,
    weapon_concept: profile.weapon_concept,
    weapon_name: oldWeaponInfo?.name ?? `${profile.weapon_concept} ${profile.weapon_type}`,
    weapon_description: oldWeaponInfo?.description ?? null,
    from_level: currentLevel,
    to_level: newLevel,
    result: result,
    gold_change: -cost,
    used_protection: useProtection ? protection : null,
  });


  // 8. 새 무기 정보 조회 (결과에 포함하기 위해)
  const { data: newWeaponInfo } = await db
    .from("weapon_descriptions")
    .select("name, description")
    .eq("weapon_type", newWeaponType)
    .eq("concept", newWeaponConcept)
    .eq("level", newLevel)
    .single();

  // 9. 페이지 새로고침
  revalidatePath("/upgrade");
  revalidatePath("/");
  revalidatePath("/inventory");

  // 10. 결과 반환
  let maintainMessage = `강화 실패... 단계가 유지되었습니다. (+${currentLevel})`;
  if (useProtection && protection === "high" && newLevel < currentLevel) {
    maintainMessage = `파괴 방지권(상) 발동! 강화단계가 -1되었습니다. (+${newLevel})`;
  } else if (useProtection && result === "MAINTAIN") {
    maintainMessage = `파괴 방지권 발동! 강화단계가 유지되었습니다. (+${currentLevel})`;
  }

  const messages = {
    SUCCESS: `강화 성공! +${currentLevel} → +${newLevel}`,
    MAINTAIN: maintainMessage,
    DESTROY: `무기가 파괴되었습니다! 새로운 ${newWeaponConcept} ${newWeaponType}(으)로 다시 시작합니다.`,
  };

  return {
    success: true,
    result,
    message: messages[result],
    newLevel,
    goldSpent: cost,
    newWeaponName: newWeaponInfo?.name ?? `${newWeaponConcept} ${newWeaponType}`,
    newWeaponDescription: newWeaponInfo?.description ?? null,
    newWeaponType: newWeaponType,
    usedProtection: useProtection ? protection : undefined,
  };
}

// ============================================
// 무기 판매 Server Action
// ============================================
export async function sellWeapon(): Promise<{
  success: boolean;
  message: string;
  goldEarned?: number;
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
  const currentLevel = profile.weapon_level;

  // 3. 0강은 판매 불가
  if (currentLevel === 0) {
    return { success: false, message: "0강 무기는 판매할 수 없습니다." };
  }

  // 4. 판매 보상 계산 (다음 강화 비용 × 2, +-20% 랜덤)
  const basePrice = UPGRADE_COSTS[currentLevel] * 2;
  const randomMultiplier = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2
  const sellPrice = Math.floor(basePrice * randomMultiplier);

  // 5. 새 랜덤 무기 생성
  const newWeaponType = WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
  const newWeaponConcept = getRandomConcept(newWeaponType);

  // 6. DB 업데이트
  const { error: updateError } = await db
    .from("profiles")
    .update({
      gold: profile.gold + sellPrice,
      weapon_level: 0,
      weapon_type: newWeaponType,
      weapon_concept: newWeaponConcept,
    })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, message: "판매 처리 중 오류가 발생했습니다." };
  }

  // 7. 판매 로그 기록
  const { data: weaponInfo } = await db
    .from("weapon_descriptions")
    .select("name, description")
    .eq("weapon_type", profile.weapon_type)
    .eq("concept", profile.weapon_concept)
    .eq("level", currentLevel)
    .single();

  await db.from("upgrade_logs").insert({
    user_id: user.id,
    nickname: profile.nickname,
    action: "SELL",
    weapon_type: profile.weapon_type,
    weapon_concept: profile.weapon_concept,
    weapon_name: weaponInfo?.name ?? `${profile.weapon_concept} ${profile.weapon_type}`,
    weapon_description: weaponInfo?.description ?? null,
    from_level: currentLevel,
    to_level: null,
    result: null,
    gold_change: sellPrice,
  });

  // 8. 페이지 새로고침
  revalidatePath("/upgrade");
  revalidatePath("/");
  revalidatePath("/inventory");

  return {
    success: true,
    message: `+${currentLevel} 무기를 ${sellPrice.toLocaleString()}G에 판매했습니다! 새로운 ${newWeaponConcept} ${newWeaponType}(으)로 다시 시작합니다.`,
    goldEarned: sellPrice,
  };
}
