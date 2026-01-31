import { createClient } from "@/lib/supabase/server";
import type { Profile, WeaponDescription } from "@/types/database";
import UpgradeButtons from "./upgrade/UpgradeButtons";
import RealtimeLogs from "./upgrade/RealtimeLogs";

export const revalidate = 0; // 실시간 데이터

// 강화 비용 테이블
const UPGRADE_COSTS: Record<number, number> = {
  0: 100, 1: 200, 2: 400, 3: 800, 4: 1600,
  5: 3200, 6: 6000, 7: 10000, 8: 16000, 9: 25000,
  10: 40000, 11: 65000, 12: 105000, 13: 170000, 14: 270000,
  15: 430000, 16: 700000, 17: 1100000, 18: 1700000, 19: 2600000,
  20: 0,
};

// 무기 타입별 이모지
const WEAPON_EMOJIS: Record<string, string> = {
  "칼": "🗡️",
  "활": "🏹",
  "지팡이": "🪄",
  "방패": "🛡️",
  "몽둥이": "🏏",
};

const getWeaponEmoji = (weaponType: string) => {
  return WEAPON_EMOJIS[weaponType] ?? "⚔️";
};

// 전체 유저 로그 타입
interface GlobalUpgradeLog {
  id: string;
  user_id: string;
  action: "UPGRADE" | "SELL";
  weapon_type: string;
  weapon_concept: string;
  weapon_name: string | null;
  weapon_description: string | null;
  from_level: number;
  to_level: number | null;
  result: "SUCCESS" | "MAINTAIN" | "DESTROY" | null;
  gold_change: number;
  created_at: string;
  nickname: string | null;
}

export default async function HomePage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();

  // 프로필 정보 (무기 상태 + 골드)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .single() as { data: Profile | null };

  // 무기 이름 + 전체 로그를 병렬 조회
  const [{ data: weaponInfo }, { data: globalLogs }] = await Promise.all([
    supabase
      .from("weapon_descriptions")
      .select("name, description")
      .eq("weapon_type", profile?.weapon_type ?? "칼")
      .eq("concept", profile?.weapon_concept ?? "그림자")
      .eq("level", profile?.weapon_level ?? 0)
      .single() as Promise<{ data: Pick<WeaponDescription, "name" | "description"> | null }>,
    db
      .from("upgrade_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20) as Promise<{ data: GlobalUpgradeLog[] | null }>,
  ]);


  const currentLevel = profile?.weapon_level ?? 0;
  const gold = profile?.gold ?? 0;
  const upgradeCost = UPGRADE_COSTS[currentLevel] ?? 0;
  const baseSellPrice = upgradeCost * 2;
  const sellPriceMin = Math.floor(baseSellPrice * 0.8);
  const sellPriceMax = Math.floor(baseSellPrice * 1.2);

  const canUpgrade = currentLevel < 20 && gold >= upgradeCost;
  const canSell = currentLevel > 0;

  return (
    <div className="space-y-3">
      {/* 무기 카드 - 모든 정보 통합 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-5">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
        </div>

        {/* 골드 - 우측 상단 */}
        <div className="absolute top-3 right-3 bg-black/30 px-3 py-1 rounded-full">
          <span className="text-yellow-400 font-bold text-sm">{gold.toLocaleString()}G</span>
        </div>

        <div className="relative z-10 text-center pt-2">
          <span className="text-6xl block mb-1">{profile ? getWeaponEmoji(profile.weapon_type) : "⚔️"}</span>
          <p className="text-white font-medium text-sm mt-2">
            {weaponInfo?.name ?? `${profile?.weapon_concept ?? ""} ${profile?.weapon_type ?? ""}`}
          </p>
          <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mt-1">
            +{currentLevel}
          </p>
        </div>
      </div>

      {/* 강화 버튼 */}
      <div className="bg-gray-900 rounded-2xl p-4">
        <UpgradeButtons
          currentLevel={currentLevel}
          gold={gold}
          upgradeCost={upgradeCost}
          canUpgrade={canUpgrade}
          canSell={canSell}
          sellPriceMin={sellPriceMin}
          sellPriceMax={sellPriceMax}
          weaponName={weaponInfo?.name ?? `${profile?.weapon_concept ?? ""} ${profile?.weapon_type ?? ""}`}
          weaponDescription={weaponInfo?.description ?? null}
          weaponType={profile?.weapon_type ?? "칼"}
          nickname={profile?.nickname ?? null}
          protectionLow={profile?.protection_low ?? 0}
          protectionMid={profile?.protection_mid ?? 0}
          protectionHigh={profile?.protection_high ?? 0}
        />
      </div>

      {/* 실시간 피드 */}
      <div className="bg-gray-900 rounded-2xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
          <span className="text-xs text-gray-400 font-medium">실시간</span>
        </div>
        <RealtimeLogs
          initialLogs={globalLogs ?? []}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
