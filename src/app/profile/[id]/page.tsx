import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Profile, WeaponDescription } from "@/types/database";

// 무기 타입별 이모지
const WEAPON_EMOJIS: Record<string, string> = {
  "칼": "🗡️",
  "활": "🏹",
  "지팡이": "🪄",
  "방패": "🛡️",
  "몽둥이": "🏏",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 유저 프로필 조회
  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single() as { data: Profile | null; error: unknown };

  if (error || !profile) {
    notFound();
  }

  // 무기 이름 조회
  const { data: weaponInfo } = await db
    .from("weapon_descriptions")
    .select("name, description")
    .eq("weapon_type", profile.weapon_type)
    .eq("concept", profile.weapon_concept)
    .eq("level", profile.weapon_level)
    .single() as { data: Pick<WeaponDescription, "name" | "description"> | null };

  const weaponName = weaponInfo?.name ?? `${profile.weapon_concept} ${profile.weapon_type}`;
  const weaponEmoji = WEAPON_EMOJIS[profile.weapon_type] ?? "⚔️";

  // 승률 계산
  const totalBattles = (profile.total_wins ?? 0) + (profile.total_losses ?? 0);
  const winRate = totalBattles > 0
    ? Math.round((profile.total_wins ?? 0) / totalBattles * 100)
    : 0;

  // 강화 성공률 계산
  const totalUpgrades = profile.total_upgrades ?? 0;
  const successRate = totalUpgrades > 0
    ? Math.round((profile.total_successes ?? 0) / totalUpgrades * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/battle">
          <Button variant="ghost" size="sm">
            ← 뒤로
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">유저 프로필</h1>
      </div>

      {/* 유저 정보 */}
      <Card variant="highlight">
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-3xl font-black text-white mb-2">
              {profile.nickname ?? "익명"}
            </p>
            <p className="text-gray-400 text-sm">
              가입일: {new Date(profile.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 현재 무기 */}
      <Card>
        <CardHeader>
          <CardTitle>현재 무기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 p-6">
            {/* 배경 이펙트 */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 text-center">
              {/* 무기 이모지 */}
              <div className="inline-block p-4 bg-gray-800/50 rounded-full mb-4">
                <span className="text-6xl block">{weaponEmoji}</span>
              </div>

              {/* 무기 이름 */}
              <p className="text-xl font-bold text-white">{weaponName}</p>

              {/* 강화 레벨 */}
              <p className="text-4xl font-black text-blue-400 mt-2">
                +{profile.weapon_level}
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
        </CardContent>
      </Card>

      {/* 배틀 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>배틀 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400">총 대전</p>
              <p className="text-2xl font-bold text-white">{totalBattles}</p>
            </div>
            <div className="text-center p-4 bg-green-900/30 rounded-lg">
              <p className="text-sm text-gray-400">승리</p>
              <p className="text-2xl font-bold text-green-400">{profile.total_wins ?? 0}</p>
            </div>
            <div className="text-center p-4 bg-red-900/30 rounded-lg">
              <p className="text-sm text-gray-400">패배</p>
              <p className="text-2xl font-bold text-red-400">{profile.total_losses ?? 0}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">승률</span>
              <span className="text-xl font-bold text-yellow-400">{winRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 강화 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>강화 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400">총 강화</p>
              <p className="text-2xl font-bold text-white">{totalUpgrades}</p>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400">성공률</p>
              <p className="text-2xl font-bold text-yellow-400">{successRate}%</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-900/30 rounded-lg">
              <p className="text-xs text-gray-400">성공</p>
              <p className="text-lg font-bold text-green-400">{profile.total_successes ?? 0}</p>
            </div>
            <div className="text-center p-3 bg-yellow-900/30 rounded-lg">
              <p className="text-xs text-gray-400">유지</p>
              <p className="text-lg font-bold text-yellow-400">{profile.total_maintains ?? 0}</p>
            </div>
            <div className="text-center p-3 bg-red-900/30 rounded-lg">
              <p className="text-xs text-gray-400">파괴</p>
              <p className="text-lg font-bold text-red-400">{profile.total_destroys ?? 0}</p>
            </div>
          </div>

          {/* 연속 성공 기록 */}
          {(profile.max_success_streak ?? 0) > 0 && (
            <div className="mt-4 p-4 bg-blue-900/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">최대 연속 성공</span>
                <span className="text-xl font-bold text-blue-400">
                  {profile.max_success_streak}연속
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 무기별 최고 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>무기별 최고 강화</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <span className="text-2xl">🗡️</span>
              <p className="text-lg font-bold text-blue-400 mt-1">+{profile.best_sword_level ?? 0}</p>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <span className="text-2xl">🏹</span>
              <p className="text-lg font-bold text-blue-400 mt-1">+{profile.best_bow_level ?? 0}</p>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <span className="text-2xl">🪄</span>
              <p className="text-lg font-bold text-blue-400 mt-1">+{profile.best_staff_level ?? 0}</p>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <span className="text-2xl">🛡️</span>
              <p className="text-lg font-bold text-blue-400 mt-1">+{profile.best_shield_level ?? 0}</p>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <span className="text-2xl">🏏</span>
              <p className="text-lg font-bold text-blue-400 mt-1">+{profile.best_club_level ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
