// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { Profile } from "@/types/database";
import HuntingClient from "./HuntingClient";

// 사냥터 정보 타입
interface HuntingGround {
  level: number;
  name: string;
  gold_reward: number;
}

export default async function HuntPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 프로필 정보
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_hunting_level, hunting_keys, gold, protection_low, protection_mid, protection_high, is_hunting, hunting_started_at")
    .eq("id", user?.id ?? "")
    .single() as { data: (Pick<Profile, "gold" | "protection_low" | "protection_mid" | "protection_high"> & {
      current_hunting_level: number;
      hunting_keys: number;
      is_hunting: boolean;
      hunting_started_at: string | null;
    }) | null };

  // 모든 사냥터 정보
  const { data: huntingGrounds } = await supabase
    .from("hunting_grounds")
    .select("*")
    .order("level", { ascending: true }) as { data: HuntingGround[] | null };

  // 사냥터별 유저 수 조회
  const { data: userCounts } = await supabase
    .from("profiles")
    .select("current_hunting_level");

  // 레벨별 유저 수 집계
  const userCountByLevel: Record<number, number> = {};
  userCounts?.forEach(u => {
    const level = u.current_hunting_level ?? 1;
    userCountByLevel[level] = (userCountByLevel[level] ?? 0) + 1;
  });

  const currentLevel = profile?.current_hunting_level ?? 1;
  const currentGround = huntingGrounds?.find(g => g.level === currentLevel);
  const keys = profile?.hunting_keys ?? 0;

  // 곡선형 골드 보상 계산 함수: 1레벨 1,000G → 20레벨 100,000G
  const calculateGold = (level: number) => Math.floor(1000 * Math.pow(100, (level - 1) / 19));
  const currentGold = calculateGold(currentLevel);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">사냥터</h1>

      {/* 보유 자원 */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 text-sm">보유 골드</span>
              <p className="text-xl font-bold text-yellow-400">
                {(profile?.gold ?? 0).toLocaleString()} G
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">열쇠</span>
              <p className="text-xl font-bold text-blue-400">
                {keys} / 3
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 현재 사냥터 */}
      <Card variant="highlight">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>현재 사냥터</span>
            <span className="text-sm text-gray-400">Lv.{currentLevel}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-3xl mb-2">
              {currentLevel <= 5 ? "🌾" : currentLevel <= 10 ? "🌲" : currentLevel <= 15 ? "⛏️" : "🏰"}
            </p>
            <h2 className="text-xl font-bold text-white mb-2">
              {currentGround?.name ?? "알 수 없는 장소"}
            </h2>
            <p className="text-gray-400 text-sm">
              예상 골드 보상: <span className="text-yellow-400">{Math.floor(currentGold * 0.9).toLocaleString()} ~ {Math.floor(currentGold * 1.1).toLocaleString()} G</span>
            </p>
          </div>

          {/* 사냥 버튼 (클라이언트 컴포넌트) */}
          <HuntingClient
            isHunting={profile?.is_hunting ?? false}
            huntingStartedAt={profile?.hunting_started_at ?? null}
            currentLevel={currentLevel}
            keys={keys}
          />

          {/* 다음 사냥터 해금 조건 */}
          {currentLevel < 20 && (
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400 text-center">
                다음 사냥터 해금까지 열쇠 <span className="text-blue-400 font-bold">{3 - keys}개</span> 필요
              </p>
              <div className="flex justify-center gap-1 mt-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded flex items-center justify-center ${
                      i < keys ? "bg-blue-500" : "bg-gray-700"
                    }`}
                  >
                    🔑
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 보상 및 확률 */}
      <Card>
        <CardHeader>
          <CardTitle>보상 및 확률</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* 골드 */}
            <div className="flex items-center justify-between p-3 bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <div>
                  <p className="text-white font-medium">골드</p>
                  <p className="text-xs text-gray-400">
                    {Math.floor(currentGold * 0.9).toLocaleString()} ~ {Math.floor(currentGold * 1.1).toLocaleString()} G
                  </p>
                </div>
              </div>
              <span className="text-yellow-400 font-bold">{currentLevel <= 10 ? "85%" : "90%"}</span>
            </div>

            {/* 열쇠 */}
            <div className="flex items-center justify-between p-3 bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔑</span>
                <div>
                  <p className="text-white font-medium">열쇠</p>
                  <p className="text-xs text-gray-400">다음 사냥터 해금용</p>
                </div>
              </div>
              <span className="text-blue-400 font-bold">{currentLevel <= 10 ? "10%" : "5%"}</span>
            </div>

            {/* 파괴방지권 */}
            <div className="flex items-center justify-between p-3 bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <div>
                  <p className="text-white font-medium">파괴방지권</p>
                  <p className="text-xs text-gray-400">
                    {currentLevel <= 5 && "하급"}
                    {currentLevel >= 6 && currentLevel <= 10 && "하급/중급"}
                    {currentLevel >= 11 && currentLevel <= 15 && "하급/중급/고급"}
                    {currentLevel >= 16 && "중급/고급"}
                  </p>
                </div>
              </div>
              <span className="text-purple-400 font-bold">5%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사냥터 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>사냥터 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {huntingGrounds?.map(ground => {
              const isUnlocked = ground.level <= currentLevel;
              const isCurrent = ground.level === currentLevel;
              const usersInLevel = userCountByLevel[ground.level] ?? 0;
              return (
                <div
                  key={ground.level}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrent
                      ? "bg-blue-900/30 border border-blue-500"
                      : isUnlocked
                        ? "bg-gray-800"
                        : "bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {ground.level <= 5 ? "🌾" : ground.level <= 10 ? "🌲" : ground.level <= 15 ? "⛏️" : "🏰"}
                    </span>
                    <div>
                      <p className={`font-medium ${isUnlocked ? "text-white" : "text-gray-400"}`}>
                        Lv.{ground.level} {ground.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        보상: {Math.floor(calculateGold(ground.level) * 0.9).toLocaleString()} ~ {Math.floor(calculateGold(ground.level) * 1.1).toLocaleString()} G
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {isCurrent && (
                      <span className="text-xs text-blue-400 font-medium block">현재</span>
                    )}
                    {!isUnlocked && (
                      <span className="text-xs text-gray-500 block">🔒</span>
                    )}
                    <span className="text-xs text-gray-500">
                      👤 {usersInLevel}명
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
