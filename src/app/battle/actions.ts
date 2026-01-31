"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Profile } from "@/types/database";

// ============================================
// 강화 비용 테이블 (보상 계산용)
// ============================================
const UPGRADE_COSTS: Record<number, number> = {
  0: 100, 1: 200, 2: 400, 3: 800, 4: 1600,
  5: 3200, 6: 6000, 7: 10000, 8: 16000, 9: 25000,
  10: 40000, 11: 65000, 12: 105000, 13: 170000, 14: 270000,
  15: 430000, 16: 700000, 17: 1100000, 18: 1700000, 19: 2600000,
  20: 0,
};

// ============================================
// 상성 테이블
// ============================================
const MATCHUP: Record<string, { strong: string[]; weak: string[] }> = {
  "칼": { strong: ["활", "지팡이"], weak: ["몽둥이", "방패"] },
  "몽둥이": { strong: ["칼", "방패"], weak: ["활", "지팡이"] },
  "활": { strong: ["몽둥이", "방패"], weak: ["칼", "지팡이"] },
  "방패": { strong: ["칼", "지팡이"], weak: ["몽둥이", "활"] },
  "지팡이": { strong: ["몽둥이", "활"], weak: ["칼", "방패"] },
};

// ============================================
// 상성 기반 결과 문구 테이블 (유리 매치업 기준)
// winAction: weapon1이 이겼을 때 / loseAction: weapon1이 졌을 때
// ============================================
const BATTLE_MESSAGES: Record<string, { winAction: string; loseAction: string }> = {
  // 칼 > 활
  "칼_활": { winAction: "재빠르게 베어버렸습니다", loseAction: "화살 사거리 안으로 파고들지" },
  // 칼 > 지팡이
  "칼_지팡이": { winAction: "마법을 끊어내버렸습니다", loseAction: "주문을 끊어내지" },
  // 몽둥이 > 칼
  "몽둥이_칼": { winAction: "정면으로 쳐내버렸습니다", loseAction: "검의 칼날을 뚫지" },
  // 몽둥이 > 방패
  "몽둥이_방패": { winAction: "부숴버렸습니다", loseAction: "벽을 넘지" },
  // 활 > 몽둥이
  "활_몽둥이": { winAction: "거리에서 꿰뚫어버렸습니다", loseAction: "거리를 유지하지" },
  // 활 > 방패
  "활_방패": { winAction: "빈틈을 정확히 꿰뚫어버렸습니다", loseAction: "방패의 빈틈을 찾지" },
  // 방패 > 칼
  "방패_칼": { winAction: "공격을 막아내고 밀어붙였습니다", loseAction: "방패를 뚫지" },
  // 방패 > 지팡이
  "방패_지팡이": { winAction: "마법을 튕겨내버렸습니다", loseAction: "마법을 막아내지" },
  // 지팡이 > 몽둥이
  "지팡이_몽둥이": { winAction: "속박 마법으로 묶어버렸습니다", loseAction: "속박을 걸지" },
  // 지팡이 > 활
  "지팡이_활": { winAction: "바람으로 궤도를 틀어버렸습니다", loseAction: "화살의 궤도를 흐트러뜨리지" },
  // 역방향 매치업 (불리한 경우)
  "활_칼": { winAction: "거리를 유지하며 명중시켰습니다", loseAction: "거리를 벌리지" },
  "지팡이_칼": { winAction: "주문으로 제압했습니다", loseAction: "검을 막아내지" },
  "칼_몽둥이": { winAction: "빠르게 베어냈습니다", loseAction: "묵직한 일격을 피하지" },
  "방패_몽둥이": { winAction: "버텨냈습니다", loseAction: "충격을 버티지" },
  "몽둥이_활": { winAction: "거리를 좁혀 내려쳤습니다", loseAction: "화살을 피하지" },
  "방패_활": { winAction: "화살을 튕겨냈습니다", loseAction: "빈틈을 막지" },
  "칼_방패": { winAction: "방어를 뚫었습니다", loseAction: "방패를 넘지" },
  "지팡이_방패": { winAction: "마법으로 압도했습니다", loseAction: "마법을 통과시키지" },
  "몽둥이_지팡이": { winAction: "마법 전에 내려쳤습니다", loseAction: "마법을 뚫지" },
  "활_지팡이": { winAction: "주문 전에 명중시켰습니다", loseAction: "마법을 피하지" },
};

// ============================================
// 상성 보너스 계산
// ============================================
function getMatchupBonus(myWeaponType: string, enemyWeaponType: string): number {
  const matchup = MATCHUP[myWeaponType];
  if (!matchup) return 0;

  if (matchup.strong.includes(enemyWeaponType)) return 12;
  if (matchup.weak.includes(enemyWeaponType)) return -12;
  return 0;
}

// ============================================
// 무기 이름에서 "+X강" 부분 제거
// ============================================
function removeWeaponLevel(weaponName: string): string {
  // "+숫자강 " 패턴 제거
  return weaponName.replace(/^\+\d+강\s*/, "");
}

// ============================================
// 결과 문구 생성
// ============================================
function getBattleMessage(
  myWeaponType: string,
  myWeaponName: string,
  myLevel: number,
  myNickname: string,
  enemyWeaponType: string,
  enemyWeaponName: string,
  enemyLevel: number,
  enemyNickname: string,
  isWin: boolean
): string {
  const key = `${myWeaponType}_${enemyWeaponType}`;
  const messages = BATTLE_MESSAGES[key];

  // 무기 이름에서 "+X강" 제거
  const cleanMyName = removeWeaponLevel(myWeaponName);
  const cleanEnemyName = removeWeaponLevel(enemyWeaponName);

  const myFullName = `[+${myLevel}강 ${cleanMyName}]`;
  const enemyFullName = `[+${enemyLevel}강 ${cleanEnemyName}]`;

  if (messages) {
    if (isWin) {
      // (A) 내가 이긴 경우
      return `**${myNickname}**의 ${myFullName}가 **${enemyNickname}**의 ${enemyFullName}를 ${messages.winAction}`;
    } else {
      // (B) 내가 진 경우 (못했습니다 문구)
      return `**${myNickname}**의 ${myFullName}가 **${enemyNickname}**의 ${enemyFullName}를 ${messages.loseAction} 못했습니다`;
    }
  }

  // 동일 타입 또는 중립 매치업
  if (isWin) {
    return `**${myNickname}**의 ${myFullName}가 **${enemyNickname}**의 ${enemyFullName}보다 한 수 위였습니다`;
  } else {
    return `**${myNickname}**의 ${myFullName}가 **${enemyNickname}**의 ${enemyFullName}를 넘지 못했습니다`;
  }
}

// ============================================
// 티켓 재생성 계산
// ============================================
function calculateTicketRegen(
  currentTickets: number,
  lastRegenAt: string | null
): { newTickets: number; newRegenAt: string } {
  const MAX_TICKETS = 10;
  const REGEN_HOURS = 2;

  const now = new Date();

  if (!lastRegenAt || currentTickets >= MAX_TICKETS) {
    return { newTickets: currentTickets, newRegenAt: now.toISOString() };
  }

  const lastRegen = new Date(lastRegenAt);
  const hoursPassed = (now.getTime() - lastRegen.getTime()) / (1000 * 60 * 60);
  const ticketsToAdd = Math.floor(hoursPassed / REGEN_HOURS);

  if (ticketsToAdd <= 0) {
    return { newTickets: currentTickets, newRegenAt: lastRegenAt };
  }

  const newTickets = Math.min(currentTickets + ticketsToAdd, MAX_TICKETS);
  // 마지막 재생 시간 업데이트 (실제 재생된 시간 기준)
  const newRegenAt = new Date(lastRegen.getTime() + ticketsToAdd * REGEN_HOURS * 60 * 60 * 1000);

  return {
    newTickets,
    newRegenAt: newTickets >= MAX_TICKETS ? now.toISOString() : newRegenAt.toISOString()
  };
}

// ============================================
// 배틀 실행 Server Action
// ============================================
export async function executeBattle(): Promise<{
  success: boolean;
  message: string;
  result?: "WIN" | "LOSE";
  battleMessage?: string;
  goldEarned?: number;
  winRate?: number;
  matchupBonus?: number;
  myWeapon?: {
    type: string;
    name: string;
    level: number;
  };
  enemyWeapon?: {
    type: string;
    name: string;
    level: number;
    nickname: string;
  };
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 1. 현재 유저 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  // 2. 프로필 조회 및 티켓 재생성
  const { data: profileData, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    return { success: false, message: "프로필을 찾을 수 없습니다." };
  }

  const profile = profileData as Profile;

  // 티켓 재생성 계산
  const { newTickets, newRegenAt } = calculateTicketRegen(
    profile.battle_ticket,
    profile.last_ticket_regen_at
  );

  // 티켓 확인
  if (newTickets <= 0) {
    return { success: false, message: "배틀 티켓이 부족합니다." };
  }

  // 3. 상대방 랜덤 매칭 (자신 제외)
  const { data: opponents, error: opponentError } = await db
    .from("profiles")
    .select("id, nickname, weapon_type, weapon_concept, weapon_level")
    .neq("id", user.id)
    .limit(50);

  if (opponentError || !opponents || opponents.length === 0) {
    return { success: false, message: "매칭할 상대가 없습니다." };
  }

  // 랜덤 상대 선택
  const opponent = opponents[Math.floor(Math.random() * opponents.length)] as {
    id: string;
    nickname: string | null;
    weapon_type: string;
    weapon_concept: string;
    weapon_level: number;
  };

  // 4. 내 무기 + 상대 무기 이름 병렬 조회
  const [{ data: myWeaponInfo }, { data: enemyWeaponInfo }] = await Promise.all([
    db
      .from("weapon_descriptions")
      .select("name")
      .eq("weapon_type", profile.weapon_type)
      .eq("concept", profile.weapon_concept)
      .eq("level", profile.weapon_level)
      .single(),
    db
      .from("weapon_descriptions")
      .select("name")
      .eq("weapon_type", opponent.weapon_type)
      .eq("concept", opponent.weapon_concept)
      .eq("level", opponent.weapon_level)
      .single(),
  ]);

  const myWeaponName = myWeaponInfo?.name ?? `${profile.weapon_concept} ${profile.weapon_type}`;
  const enemyWeaponName = enemyWeaponInfo?.name ?? `${opponent.weapon_concept} ${opponent.weapon_type}`;

  // 6. 승률 계산
  const levelDiff = profile.weapon_level - opponent.weapon_level;
  const baseWinRate = Math.max(5, Math.min(95, 50 + levelDiff * 20));
  const matchupBonus = getMatchupBonus(profile.weapon_type, opponent.weapon_type);
  const finalWinRate = Math.max(5, Math.min(95, baseWinRate + matchupBonus));

  // 7. 배틀 결과 결정
  const roll = Math.random() * 100;
  const isWin = roll < finalWinRate;

  // 8. 보상 계산 (승리 시 상대 무기 가치)
  const enemyWeaponValue = (UPGRADE_COSTS[opponent.weapon_level] ?? 0) * 2;
  const goldEarned = isWin ? enemyWeaponValue : 0;

  // 9. 결과 문구 생성
  const battleMessage = getBattleMessage(
    profile.weapon_type,
    myWeaponName,
    profile.weapon_level,
    profile.nickname ?? "익명",
    opponent.weapon_type,
    enemyWeaponName,
    opponent.weapon_level,
    opponent.nickname ?? "익명",
    isWin
  );

  // 10. DB 업데이트
  const updateData: Record<string, unknown> = {
    battle_ticket: newTickets - 1,
    last_ticket_regen_at: newRegenAt,
    gold: profile.gold + goldEarned,
  };

  if (isWin) {
    updateData.total_wins = (profile.total_wins ?? 0) + 1;
  } else {
    updateData.total_losses = (profile.total_losses ?? 0) + 1;
  }

  const { error: updateError } = await db
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (updateError) {
    return { success: false, message: "배틀 처리 중 오류가 발생했습니다." };
  }

  // 11. 배틀 로그 기록
  await db.from("battle_logs").insert({
    user_id: user.id,
    my_weapon_type: profile.weapon_type,
    my_weapon_concept: profile.weapon_concept,
    my_weapon_level: profile.weapon_level,
    my_weapon_name: myWeaponName,
    opponent_weapon_type: opponent.weapon_type,
    opponent_weapon_concept: opponent.weapon_concept,
    opponent_weapon_level: opponent.weapon_level,
    opponent_weapon_name: enemyWeaponName,
    win_rate: finalWinRate,
    matchup_bonus: matchupBonus,
    result: isWin ? "WIN" : "LOSE",
    gold_earned: goldEarned,
    battle_message: battleMessage,
  });

  // 12. 페이지 새로고침
  revalidatePath("/battle");

  return {
    success: true,
    message: isWin ? "승리!" : "패배...",
    result: isWin ? "WIN" : "LOSE",
    battleMessage,
    goldEarned,
    winRate: finalWinRate,
    matchupBonus,
    myWeapon: {
      type: profile.weapon_type,
      name: myWeaponName,
      level: profile.weapon_level,
    },
    enemyWeapon: {
      type: opponent.weapon_type,
      name: enemyWeaponName,
      level: opponent.weapon_level,
      nickname: opponent.nickname ?? "익명",
    },
  };
}

// ============================================
// 랭킹 조회 (강화 순서, 같으면 달성 시간순)
// ============================================
export async function getRankings(limit: number = 20): Promise<{
  rankings: Array<{
    id: string;
    nickname: string;
    weapon_type: string;
    weapon_level: number;
    rank: number;
  }>;
  myRank: number | null;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();

  // 전체 랭킹 조회 (강화 레벨 내림차순, 생성일 오름차순)
  const { data: allRankings } = await db
    .from("profiles")
    .select("id, nickname, weapon_type, weapon_level, created_at")
    .order("weapon_level", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(100);

  if (!allRankings) {
    return { rankings: [], myRank: null };
  }

  // 내 순위 찾기
  let myRank: number | null = null;
  if (user) {
    const myIndex = allRankings.findIndex((r: { id: string }) => r.id === user.id);
    if (myIndex !== -1) {
      myRank = myIndex + 1;
    }
  }

  // 상위 N명만 반환
  const rankings = allRankings.slice(0, limit).map((r: {
    id: string;
    nickname: string | null;
    weapon_type: string;
    weapon_level: number;
  }, index: number) => ({
    id: r.id,
    nickname: r.nickname ?? "익명",
    weapon_type: r.weapon_type,
    weapon_level: r.weapon_level,
    rank: index + 1,
  }));

  return { rankings, myRank };
}

// ============================================
// 티켓 정보 조회
// ============================================
export async function getTicketInfo(): Promise<{
  tickets: number;
  nextRegenAt: string | null;
  maxTickets: number;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { tickets: 0, nextRegenAt: null, maxTickets: 10 };
  }

  const { data: profile } = await db
    .from("profiles")
    .select("battle_ticket, last_ticket_regen_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { tickets: 0, nextRegenAt: null, maxTickets: 10 };
  }

  // 티켓 재생성 계산
  const { newTickets, newRegenAt } = calculateTicketRegen(
    profile.battle_ticket,
    profile.last_ticket_regen_at
  );

  // 다음 재생 시간 계산
  let nextRegenAt: string | null = null;
  if (newTickets < 10) {
    const lastRegen = new Date(newRegenAt);
    nextRegenAt = new Date(lastRegen.getTime() + 2 * 60 * 60 * 1000).toISOString();
  }

  return {
    tickets: newTickets,
    nextRegenAt,
    maxTickets: 10,
  };
}
