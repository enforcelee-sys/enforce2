import { createClient } from "@/lib/supabase/server";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { Profile, Title, UserTitle } from "@/types/database";
import NicknameEditor from "./NicknameEditor";
import LogoutButton from "./LogoutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 프로필 정보
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .single() as { data: Profile | null };

  // 전체 칭호 목록
  const { data: allTitles } = await supabase
    .from("titles")
    .select("*")
    .order("condition_value", { ascending: true }) as { data: Title[] | null };

  // 유저가 보유한 칭호
  const { data: userTitles } = await supabase
    .from("user_titles")
    .select("*, title:titles(*)")
    .eq("user_id", user?.id ?? "") as { data: UserTitle[] | null };

  const ownedTitleIds = new Set(userTitles?.map((ut) => ut.title_id) ?? []);
  const equippedTitle = userTitles?.find((ut) => ut.is_equipped);

  // 강화 성공률 계산
  const successRate = profile && profile.total_upgrades > 0
    ? ((profile.total_successes / profile.total_upgrades) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">프로필</h1>

      {/* 유저 정보 카드 */}
      <Card variant="highlight">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            {/* 아바타 */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl">
              {profile?.nickname ? profile.nickname[0] : "?"}
            </div>

            <div className="flex-1">
              {/* 닉네임 */}
              <NicknameEditor currentNickname={profile?.nickname ?? null} />

              {/* 장착 중인 칭호 */}
              {equippedTitle?.title && (
                <p className="text-yellow-400 text-sm font-medium mt-1">
                  {equippedTitle.title.name}
                </p>
              )}

              {/* 보유 골드 */}
              <p className="text-gray-400 text-sm mt-1">
                보유 골드: <span className="text-yellow-400 font-bold">{(profile?.gold ?? 0).toLocaleString()}G</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 강화 & 배틀 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>강화 & 배틀 통계</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 강화 통계 */}
          <p className="text-sm text-gray-400 mb-2">강화</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">총 시도</p>
              <p className="text-xl font-bold text-white">{profile?.total_upgrades ?? 0}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">성공률</p>
              <p className="text-xl font-bold text-green-400">{successRate}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">연속 성공</p>
              <p className="text-xl font-bold text-blue-400">{profile?.max_success_streak ?? 0}</p>
            </div>
            <div className="bg-green-900/30 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">성공</p>
              <p className="text-xl font-bold text-green-400">{profile?.total_successes ?? 0}</p>
            </div>
            <div className="bg-yellow-900/30 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">유지</p>
              <p className="text-xl font-bold text-yellow-400">{profile?.total_maintains ?? 0}</p>
            </div>
            <div className="bg-red-900/30 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">파괴</p>
              <p className="text-xl font-bold text-red-400">{profile?.total_destroys ?? 0}</p>
            </div>
          </div>

          {/* 배틀 통계 */}
          <p className="text-sm text-gray-400 mb-2">배틀</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">총 배틀</p>
              <p className="text-xl font-bold text-white">{(profile?.total_wins ?? 0) + (profile?.total_losses ?? 0)}</p>
            </div>
            <div className="bg-green-900/30 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">승리</p>
              <p className="text-xl font-bold text-green-400">{profile?.total_wins ?? 0}</p>
            </div>
            <div className="bg-red-900/30 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">패배</p>
              <p className="text-xl font-bold text-red-400">{profile?.total_losses ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 무기별 최고 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>무기별 최고 강화</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-xl">🗡️ 칼</span>
              <span className="text-lg font-bold text-white">+{profile?.best_sword_level ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-xl">🏹 활</span>
              <span className="text-lg font-bold text-white">+{profile?.best_bow_level ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-xl">🪄 지팡이</span>
              <span className="text-lg font-bold text-white">+{profile?.best_staff_level ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-xl">🛡️ 방패</span>
              <span className="text-lg font-bold text-white">+{profile?.best_shield_level ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-xl">🏏 몽둥이</span>
              <span className="text-lg font-bold text-white">+{profile?.best_club_level ?? 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 칭호 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>칭호</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 장착 중인 칭호 */}
          <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">장착 중</p>
            {equippedTitle?.title ? (
              <div>
                <p className="text-lg font-bold text-yellow-400">
                  {equippedTitle.title.name}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {equippedTitle.title.description}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">장착된 칭호가 없습니다</p>
            )}
          </div>

          {/* 보유 칭호 목록 */}
          <p className="text-sm text-gray-400 mb-2">보유 칭호 ({userTitles?.length ?? 0}개)</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {userTitles && userTitles.length > 0 ? (
              userTitles.map((ut) => (
                <div
                  key={ut.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    ut.is_equipped ? "bg-yellow-900/30 border border-yellow-500" : "bg-gray-800"
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{ut.title?.name}</p>
                    <p className="text-sm text-gray-400">{ut.title?.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={ut.is_equipped ? "ghost" : "secondary"}
                  >
                    {ut.is_equipped ? "장착 중" : "장착"}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">보유한 칭호가 없습니다</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 칭호 도감 */}
      <Card>
        <CardHeader>
          <CardTitle>칭호 도감</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {allTitles?.map((title) => {
              const isOwned = ownedTitleIds.has(title.id);
              return (
                <div
                  key={title.id}
                  className={`p-3 rounded-lg ${
                    isOwned ? "bg-gray-800" : "bg-gray-900 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isOwned ? "text-white" : "text-gray-500"}`}>
                        {isOwned ? title.name : "???"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {title.description}
                      </p>
                    </div>
                    {isOwned ? (
                      <span className="text-green-400 text-sm">획득</span>
                    ) : (
                      <span className="text-gray-600 text-sm">미획득</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 로그아웃 */}
      <div className="text-center pt-4">
        <LogoutButton />
      </div>
    </div>
  );
}
