"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

// 시간 포맷팅 함수
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR");
};

// 익명 닉네임 생성
const getDisplayName = (nickname: string | null, userId: string) => {
  if (nickname) return nickname;
  return `모험가#${userId.substring(0, 4)}`;
};

interface UpgradeLog {
  id: string;
  user_id: string;
  nickname: string | null;
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
}

interface RealtimeLogsProps {
  initialLogs: UpgradeLog[];
  currentUserId: string | null;
}

export default function RealtimeLogs({ initialLogs, currentUserId }: RealtimeLogsProps) {
  const [logs, setLogs] = useState<UpgradeLog[]>(initialLogs);
  const supabase = createClient();

  useEffect(() => {
    // Supabase Realtime 구독
    const channel = supabase
      .channel("upgrade_logs_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "upgrade_logs",
        },
        (payload) => {
          const newLog = payload.new as UpgradeLog;
          setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (!logs || logs.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        아직 강화 기록이 없습니다.<br />
        첫 번째 강화를 시도해보세요!
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {logs.map((log) => {
        const displayName = getDisplayName(log.nickname, log.user_id);
        const isMyLog = log.user_id === currentUserId;
        const weaponEmoji = getWeaponEmoji(log.weapon_type);
        const isBreakingNews = log.from_level >= 10;

        return (
          <div
            key={log.id}
            className={`relative overflow-hidden rounded-lg p-3 transition-all ${
              log.action === "SELL"
                ? "bg-blue-900/20 border border-blue-800/30"
                : log.result === "SUCCESS"
                ? "bg-green-900/20 border border-green-800/30"
                : log.result === "DESTROY"
                ? "bg-red-900/20 border border-red-800/30"
                : "bg-yellow-900/20 border border-yellow-800/30"
            } ${isMyLog ? "ring-1 ring-white/20" : ""} ${isBreakingNews ? "ring-2 ring-orange-500/50" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* 왼쪽: 무기 이모지 + 정보 */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">{weaponEmoji}</span>
                <div className="flex-1 min-w-0">
                  {/* 유저 이름 + 결과 */}
                  <p className="text-sm text-white">
                    {isBreakingNews && (
                      <span className="text-orange-400 font-black mr-1">[속보]</span>
                    )}
                    <span className={`font-bold ${isMyLog ? "text-blue-400" : "text-gray-200"}`}>
                      {displayName}
                    </span>
                    <span className="text-gray-400">님이 </span>
                    {log.action === "SELL" ? (
                      <>
                        <span className="text-white font-medium">
                          {log.weapon_name ?? `${log.weapon_concept} ${log.weapon_type}`}
                        </span>
                        <span className="text-gray-400"> +{log.from_level}을 </span>
                        <span className="text-blue-400 font-bold">판매</span>
                      </>
                    ) : log.result === "SUCCESS" ? (
                      <>
                        <span className="text-white font-medium">
                          {log.weapon_name ?? `${log.weapon_concept} ${log.weapon_type}`}
                        </span>
                        <span className="text-gray-400"> +{log.from_level} → </span>
                        <span className="text-green-400 font-bold">+{log.to_level} 성공!</span>
                      </>
                    ) : log.result === "DESTROY" ? (
                      <>
                        <span className="text-white font-medium">
                          {log.weapon_name ?? `${log.weapon_concept} ${log.weapon_type}`}
                        </span>
                        <span className="text-gray-400"> +{log.from_level}이 </span>
                        <span className="text-red-400 font-bold">파괴됨...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-white font-medium">
                          {log.weapon_name ?? `${log.weapon_concept} ${log.weapon_type}`}
                        </span>
                        <span className="text-gray-400"> +{log.from_level} 강화 </span>
                        <span className="text-yellow-400 font-bold">유지</span>
                      </>
                    )}
                  </p>
                  {/* 무기 설명 */}
                  {log.weapon_description && (
                    <p className="text-xs text-gray-400 mt-1 italic truncate">
                      &quot;{log.weapon_description}&quot;
                    </p>
                  )}
                  {/* 시간 */}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(log.created_at)}
                  </p>
                </div>
              </div>

              {/* 오른쪽: 결과 뱃지 */}
              <div className="flex-shrink-0">
                {log.action === "SELL" ? (
                  <span className="px-2 py-1 text-xs font-bold rounded bg-blue-500/20 text-blue-400">
                    판매
                  </span>
                ) : log.result === "SUCCESS" ? (
                  <span className="px-2 py-1 text-xs font-bold rounded bg-green-500/20 text-green-400">
                    성공
                  </span>
                ) : log.result === "DESTROY" ? (
                  <span className="px-2 py-1 text-xs font-bold rounded bg-red-500/20 text-red-400">
                    파괴
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-500/20 text-yellow-400">
                    유지
                  </span>
                )}
              </div>
            </div>

            {/* 내 로그 표시 */}
            {isMyLog && (
              <div className="absolute top-1 right-1">
                <span className="text-[10px] text-gray-500">나</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
