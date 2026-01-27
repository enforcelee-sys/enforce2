import { createClient } from "@/lib/supabase/server";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { Profile } from "@/types/database";
import CheckInButton from "./CheckInButton";

export default async function DailyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 프로필 정보 (출석 상태)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .single() as { data: Profile | null };

  // 4시간 경과 여부 체크
  const lastCheckin = profile?.last_checkin_at ? new Date(profile.last_checkin_at) : null;
  const now = new Date();
  const hoursSinceLastCheckin = lastCheckin
    ? (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60)
    : 999;
  const canCheckin = hoursSinceLastCheckin >= 4;
  const remainingHours = Math.ceil(4 - hoursSinceLastCheckin);

  // 연속 출석 일수
  const streakDay = profile?.today_checkin_count ?? 0;
  const todayCheckinGold = profile?.today_checkin_gold ?? 0;

  // 연속 출석 보상 목록
  const rewards = [
    { day: 1, claimed: streakDay >= 1 },
    { day: 2, claimed: streakDay >= 2 },
    { day: 3, claimed: streakDay >= 3 },
    { day: 4, claimed: streakDay >= 4 },
    { day: 5, reward: "+30만 보너스", claimed: streakDay >= 5, bonus: true },
    { day: 6, claimed: streakDay >= 6 },
    { day: 7, reward: "+70만 보너스", claimed: streakDay >= 7, bonus: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">출석체크</h1>

      {/* 오늘의 출석 */}
      <Card variant={!canCheckin ? "default" : "highlight"}>
        <CardHeader>
          <CardTitle>출석 체크 (4시간 주기)</CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <CheckInButton canCheckin={canCheckin} remainingHours={remainingHours} lastCheckinAt={profile?.last_checkin_at ?? null} />
        </CardContent>
      </Card>

      {/* 오늘 출석 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>오늘 출석 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400">연속 출석</p>
              <p className="text-2xl font-bold text-blue-400">{streakDay}일차</p>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400">오늘 획득 골드</p>
              <p className="text-2xl font-bold text-yellow-400">{todayCheckinGold.toLocaleString()} G</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 주간 출석 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>연속 출석 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const isCompleted = streakDay >= day;
              const isBonus = day === 5 || day === 7;
              return (
                <div
                  key={day}
                  className={`text-center py-3 rounded-lg ${
                    isCompleted
                      ? isBonus
                        ? "bg-orange-900/50 border border-orange-500"
                        : "bg-green-900/50 border border-green-500"
                      : "bg-gray-800 border border-gray-700"
                  }`}
                >
                  <p className="text-xs text-gray-400">{day}일</p>
                  <p className={isCompleted ? (isBonus ? "text-orange-400" : "text-green-400") : "text-gray-600"}>
                    {isCompleted ? "✓" : "-"}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 연속 출석 보상 */}
      <Card>
        <CardHeader>
          <CardTitle>연속 출석 보상</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rewards.map((item) => (
              <div
                key={item.day}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  item.claimed
                    ? item.bonus
                      ? "bg-orange-900/30 border border-orange-500/50"
                      : "bg-gray-800"
                    : item.bonus
                    ? "bg-gray-900 border border-orange-500/30"
                    : "bg-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      item.claimed
                        ? item.bonus
                          ? "bg-orange-600"
                          : "bg-green-600"
                        : "bg-gray-700"
                    }`}
                  >
                    {item.claimed ? "✓" : item.day}
                  </span>
                  <span className={item.claimed ? "text-gray-400" : "text-white"}>
                    {item.day}일차
                    {item.bonus && <span className="text-orange-400 ml-1 text-xs">(보너스)</span>}
                  </span>
                </div>
                {item.reward && (
                  <span className={item.claimed ? "text-gray-500" : "text-orange-400"}>
                    {item.reward}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
