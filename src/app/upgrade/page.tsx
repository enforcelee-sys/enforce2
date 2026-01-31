import { createClient } from "@/lib/supabase/server";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { Profile, WeaponDescription } from "@/types/database";
import UpgradeButtons from "./UpgradeButtons";
import RealtimeLogs from "./RealtimeLogs";

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

export default async function UpgradePage() {
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">강화하기</h1>

      {/* 보유 골드 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">보유 골드</span>
            <span className="text-2xl font-bold text-yellow-400">
              {gold.toLocaleString()} G
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 현재 무기 - 개선된 디자인 */}
      <Card variant="highlight">
        <CardHeader>
          <CardTitle>현재 무기</CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 p-6">
              {/* 배경 이펙트 */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 text-center">
                {/* 무기 이모지 */}
                <div className="inline-block p-4 bg-gray-800/50 rounded-full mb-4">
                  <span className="text-6xl block">
                    {getWeaponEmoji(profile.weapon_type)}
                  </span>
                </div>

                {/* 무기 이름 */}
                <p className="text-xl font-bold text-white">
                  {weaponInfo?.name ?? `${profile.weapon_concept} ${profile.weapon_type}`}
                </p>

                {/* 강화 레벨 */}
                <p className="text-4xl font-black text-blue-400 mt-2">
                  +{currentLevel}
                </p>

                {/* 무기 타입 & 컨셉 */}
                <p className="text-sm text-gray-400 mt-2">
                  {profile.weapon_type} · {profile.weapon_concept}
                </p>

                {/* 무기 설명 */}
                {weaponInfo?.description && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-gray-300 text-sm italic leading-relaxed">
                      &quot;{weaponInfo.description}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              프로필 정보를 불러올 수 없습니다
            </p>
          )}
        </CardContent>
      </Card>

      {/* 강화 버튼 */}
      <Card>
        <CardContent className="py-6">
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
        </CardContent>
      </Card>

      {/* 전체 유저 강화 피드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            실시간 강화 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RealtimeLogs
            initialLogs={globalLogs ?? []}
            currentUserId={user?.id ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
