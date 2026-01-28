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
    <div className="space-y-3">
      {/* 헤더 + 현황 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">출석체크</h1>
        <div className="flex gap-3 text-sm">
          <span className="text-blue-400 font-bold">{streakDay}일차</span>
          <span className="text-yellow-400 font-bold">{todayCheckinGold.toLocaleString()}G</span>
        </div>
      </div>

      {/* 출석 버튼 */}
      <div className={`rounded-2xl p-4 ${canCheckin ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-800"}`}>
        <CheckInButton canCheckin={canCheckin} remainingHours={remainingHours} lastCheckinAt={profile?.last_checkin_at ?? null} />
      </div>

      {/* 주간 출석 현황 */}
      <div className="bg-gray-900 rounded-2xl p-3">
        <p className="text-xs text-gray-500 mb-2">연속 출석</p>
        <div className="grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isCompleted = streakDay >= day;
            const isBonus = day === 5 || day === 7;
            return (
              <div
                key={day}
                className={`text-center py-2 rounded-xl ${
                  isCompleted
                    ? isBonus
                      ? "bg-orange-500/20 border border-orange-500"
                      : "bg-green-500/20 border border-green-500"
                    : "bg-gray-800"
                }`}
              >
                <p className="text-[10px] text-gray-500">{day}</p>
                <p className={`text-sm ${isCompleted ? (isBonus ? "text-orange-400" : "text-green-400") : "text-gray-600"}`}>
                  {isCompleted ? "✓" : "-"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 보상 목록 - 컴팩트 */}
      <div className="bg-gray-900 rounded-2xl p-3">
        <p className="text-xs text-gray-500 mb-2">보상</p>
        <div className="grid grid-cols-2 gap-2">
          {rewards.filter(r => r.bonus).map((item) => (
            <div
              key={item.day}
              className={`flex items-center justify-between p-2 rounded-xl ${
                item.claimed ? "bg-orange-500/20" : "bg-gray-800"
              }`}
            >
              <span className="text-xs text-gray-400">{item.day}일차</span>
              <span className={`text-xs font-bold ${item.claimed ? "text-orange-400" : "text-orange-300"}`}>
                {item.reward}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
