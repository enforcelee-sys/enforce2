import { createClient } from "@/lib/supabase/server";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { Profile, WeaponDescription } from "@/types/database";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 프로필 정보 (무기 상태)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .single() as { data: Profile | null };

  // 현재 무기 이름 조회
  const { data: weaponInfo } = await supabase
    .from("weapon_descriptions")
    .select("name, description")
    .eq("weapon_type", profile?.weapon_type ?? "칼")
    .eq("concept", profile?.weapon_concept ?? "그림자")
    .eq("level", profile?.weapon_level ?? 0)
    .single() as { data: Pick<WeaponDescription, "name" | "description"> | null };

  // 강화 단계에 따른 색상
  const getLevelColor = (level: number) => {
    if (level >= 15) return "text-yellow-400 border-yellow-500";
    if (level >= 10) return "text-purple-400 border-purple-500";
    if (level >= 5) return "text-blue-400 border-blue-500";
    if (level >= 1) return "text-green-400 border-green-500";
    return "text-gray-400 border-gray-500";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">🎒 인벤토리</h1>

      {/* 현재 무기 */}
      <div className="grid gap-4 md:grid-cols-1">
        {profile ? (
          <Card
            variant="highlight"
            className={`${getLevelColor(profile.weapon_level)}`}
          >
            <CardHeader>
              <CardTitle>현재 무기</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">⚔️</div>
                <div>
                  <p className="font-bold text-white text-lg">
                    {weaponInfo?.name ?? `${profile.weapon_concept} ${profile.weapon_type}`}
                  </p>
                  <p className="text-sm text-gray-400">
                    {profile.weapon_type} · {profile.weapon_concept}
                  </p>
                  <p className="text-sm text-blue-400 mt-1">
                    +{profile.weapon_level} 강화
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="md:col-span-2">
            <CardContent className="text-center py-8">
              <p className="text-gray-500">프로필 정보를 불러올 수 없습니다</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 보유 재화 */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>보유 재화</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">골드</p>
                <p className="text-xl font-bold text-yellow-400">
                  {profile.gold?.toLocaleString()} G
                </p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">배틀 티켓</p>
                <p className="text-xl font-bold text-green-400">
                  {profile.battle_ticket}개
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 파괴 방지권 */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>파괴 방지권</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400">저급 (10강 이하)</p>
                <p className="text-lg font-bold text-white">{profile.protection_low}개</p>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400">중급 (15강 이하)</p>
                <p className="text-lg font-bold text-white">{profile.protection_mid}개</p>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400">고급 (15강 이상)</p>
                <p className="text-lg font-bold text-white">{profile.protection_high}개</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
