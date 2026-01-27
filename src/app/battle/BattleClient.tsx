"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { executeBattle } from "./actions";

// 무기 타입별 이모지
const WEAPON_EMOJIS: Record<string, string> = {
  "칼": "🗡️",
  "활": "🏹",
  "지팡이": "🪄",
  "방패": "🛡️",
  "몽둥이": "🏏",
};

interface BattleClientProps {
  initialTickets: number;
  nextRegenAt: string | null;
  maxTickets: number;
  myWeaponLevel: number;
  myWeaponType: string;
  myRank: number | null;
  rankings: Array<{
    id: string;
    nickname: string;
    weapon_type: string;
    weapon_level: number;
    rank: number;
  }>;
}

interface BattleResult {
  result: "WIN" | "LOSE";
  battleMessage: string;
  goldEarned: number;
  winRate: number;
  matchupBonus: number;
  myWeapon: {
    type: string;
    name: string;
    level: number;
  };
  enemyWeapon: {
    type: string;
    name: string;
    level: number;
    nickname: string;
  };
}

export default function BattleClient({
  initialTickets,
  nextRegenAt,
  maxTickets,
  myWeaponLevel,
  myWeaponType,
  myRank,
  rankings,
}: BattleClientProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [isBattling, setIsBattling] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 티켓 재생성 타이머
  const [timeToRegen, setTimeToRegen] = useState<number>(0);

  useEffect(() => {
    if (!nextRegenAt || tickets >= maxTickets) {
      setTimeToRegen(0);
      return;
    }

    const calculateTime = () => {
      const nextRegen = new Date(nextRegenAt);
      const now = new Date();
      const diff = nextRegen.getTime() - now.getTime();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeToRegen(calculateTime());

    const interval = setInterval(() => {
      const remaining = calculateTime();
      setTimeToRegen(remaining);

      // 재생 완료 시 티켓 추가
      if (remaining <= 0 && tickets < maxTickets) {
        setTickets(prev => Math.min(prev + 1, maxTickets));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRegenAt, tickets, maxTickets]);

  // 시:분:초 포맷
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // 배틀 실행
  const handleBattle = async () => {
    if (isBattling || tickets <= 0) return;

    setIsBattling(true);
    setBattleResult(null);

    try {
      const result = await executeBattle();

      if (result.success && result.result) {
        setTickets(prev => Math.max(0, prev - 1));
        setBattleResult({
          result: result.result,
          battleMessage: result.battleMessage ?? "",
          goldEarned: result.goldEarned ?? 0,
          winRate: result.winRate ?? 50,
          matchupBonus: result.matchupBonus ?? 0,
          myWeapon: result.myWeapon!,
          enemyWeapon: result.enemyWeapon!,
        });
        setShowResult(true);
      } else {
        alert(result.message);
      }
    } catch {
      alert("배틀 중 오류가 발생했습니다.");
    } finally {
      setIsBattling(false);
    }
  };

  // 결과 팝업 닫기
  const closeResult = () => {
    setShowResult(false);
  };

  return (
    <>
      <div className="space-y-6">
        {/* 내 전투력 & 티켓 */}
        <Card variant="highlight">
          <CardHeader>
            <CardTitle>내 전투력</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-5xl font-black text-yellow-400 mb-1">
                  +{myWeaponLevel}
                </p>
                <p className="text-gray-400 text-sm">
                  현재 순위: {myRank ? `${myRank}위` : "-"}
                </p>
              </div>
              <div className="border-l border-gray-700 pl-6 ml-6">
                <p className="text-sm text-gray-400 mb-1">배틀 티켓</p>
                <p className="text-2xl font-bold text-blue-400">
                  {tickets} / {maxTickets}
                </p>
                {tickets < maxTickets && timeToRegen > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    다음 충전: {formatTime(timeToRegen)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 배틀 모드 */}
        <Card>
          <CardHeader>
            <CardTitle>배틀 모드</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* PvP 대전 */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-white">PvP 대전</p>
                  <p className="text-sm text-gray-400">다른 유저와 대결</p>
                </div>
                <Button
                  onClick={handleBattle}
                  disabled={isBattling || tickets <= 0}
                >
                  {isBattling ? "매칭 중..." : tickets <= 0 ? "티켓 부족" : "도전"}
                </Button>
              </div>

              {/* 툴팁 */}
              <div className="text-xs text-gray-500 space-y-1 border-t border-gray-700 pt-3">
                <p>- 무기마다 상성이 있습니다.</p>
                <p>- 강화 등급이 같으면 승률은 50:50입니다.</p>
                <p>- 강화 등급이 1 차이날 때마다 승률이 20%p씩 변합니다.</p>
                <p>- 상성에 따라 승률이 추가로 변할 수 있습니다.</p>
              </div>
            </div>

            {/* 보스 레이드 */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-400">보스 레이드</p>
                  <p className="text-sm text-gray-500">강력한 보스와 대결</p>
                </div>
                <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-sm">
                  준비 중
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 상성표 */}
        <Card>
          <CardHeader>
            <CardTitle>무기 상성표</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-2 px-3 text-left text-gray-400">무기</th>
                    <th className="py-2 px-3 text-center text-green-400">유리 (+12%)</th>
                    <th className="py-2 px-3 text-center text-red-400">불리 (-12%)</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-800">
                    <td className="py-2 px-3">🗡️ 칼</td>
                    <td className="py-2 px-3 text-center text-green-400">활, 지팡이</td>
                    <td className="py-2 px-3 text-center text-red-400">몽둥이, 방패</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 px-3">🏏 몽둥이</td>
                    <td className="py-2 px-3 text-center text-green-400">칼, 방패</td>
                    <td className="py-2 px-3 text-center text-red-400">활, 지팡이</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 px-3">🏹 활</td>
                    <td className="py-2 px-3 text-center text-green-400">몽둥이, 방패</td>
                    <td className="py-2 px-3 text-center text-red-400">칼, 지팡이</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 px-3">🛡️ 방패</td>
                    <td className="py-2 px-3 text-center text-green-400">칼, 지팡이</td>
                    <td className="py-2 px-3 text-center text-red-400">몽둥이, 활</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">🪄 지팡이</td>
                    <td className="py-2 px-3 text-center text-green-400">몽둥이, 활</td>
                    <td className="py-2 px-3 text-center text-red-400">칼, 방패</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 전투력 랭킹 */}
        <Card>
          <CardHeader>
            <CardTitle>전투력 랭킹</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rankings.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className="block"
                >
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-gray-700/50 ${
                      user.rank <= 3 ? "bg-yellow-900/30" : "bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                          user.rank === 1
                            ? "bg-yellow-500 text-black"
                            : user.rank === 2
                            ? "bg-gray-400 text-black"
                            : user.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        {user.rank}
                      </span>
                      <div>
                        <p className="font-medium text-white">{user.nickname}</p>
                        <p className="text-sm text-gray-400">
                          {WEAPON_EMOJIS[user.weapon_type] ?? "⚔️"} {user.weapon_type}
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-blue-400">
                      +{user.weapon_level}
                    </p>
                  </div>
                </Link>
              ))}

              {rankings.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  아직 등록된 유저가 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 배틀 결과 팝업 */}
      {showResult && battleResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeResult}
        >
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* 팝업 컨테이너 */}
          <div
            className="relative w-full max-w-md animate-popup"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 글로우 이펙트 */}
            <div className={`absolute -inset-1 rounded-3xl blur-xl opacity-50 ${
              battleResult.result === "WIN" ? "bg-green-500" : "bg-red-500"
            }`} />

            {/* 메인 팝업 */}
            <div className={`relative overflow-hidden rounded-2xl border-2 ${
              battleResult.result === "WIN"
                ? "border-green-400 bg-gradient-to-b from-green-900/95 via-gray-900/98 to-gray-900"
                : "border-red-400 bg-gradient-to-b from-red-900/95 via-gray-900/98 to-gray-900"
            }`}>
              {/* 상단 장식 라인 */}
              <div className={`h-1 w-full ${
                battleResult.result === "WIN"
                  ? "bg-gradient-to-r from-transparent via-green-400 to-transparent"
                  : "bg-gradient-to-r from-transparent via-red-400 to-transparent"
              }`} />

              <div className="p-6">
                {/* 이모지 */}
                <div className="text-center mb-4">
                  <div className={`inline-block p-4 rounded-full ${
                    battleResult.result === "WIN" ? "bg-green-500/20" : "bg-red-500/20"
                  }`}>
                    <span className="text-6xl block">
                      {battleResult.result === "WIN" ? "🎉" : "😢"}
                    </span>
                  </div>
                </div>

                {/* 타이틀 */}
                <h2 className={`text-3xl font-black text-center mb-3 ${
                  battleResult.result === "WIN" ? "text-green-400" : "text-red-400"
                }`}>
                  {battleResult.result === "WIN" ? "승리!" : "패배..."}
                </h2>

                {/* 배틀 메시지 */}
                <p className="text-center text-white mb-4 leading-relaxed">
                  {battleResult.battleMessage.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      // **닉네임** 형태를 강조
                      return (
                        <span key={i} className="text-yellow-400 font-bold">
                          {part.slice(2, -2)}
                        </span>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </p>

                {/* 승률 정보 */}
                <div className="flex justify-center gap-4 mb-4 text-sm">
                  <span className="text-gray-400">
                    승률: <span className="text-yellow-400">{battleResult.winRate}%</span>
                  </span>
                  {battleResult.matchupBonus !== 0 && (
                    <span className={battleResult.matchupBonus > 0 ? "text-green-400" : "text-red-400"}>
                      상성: {battleResult.matchupBonus > 0 ? "+" : ""}{battleResult.matchupBonus}%
                    </span>
                  )}
                </div>

                {/* VS 표시 */}
                <div className="flex items-center justify-center gap-4 mb-5">
                  <div className="text-center">
                    <span className="text-4xl">
                      {WEAPON_EMOJIS[battleResult.myWeapon.type] ?? "⚔️"}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">+{battleResult.myWeapon.level}</p>
                  </div>
                  <span className="text-2xl text-gray-500">VS</span>
                  <div className="text-center">
                    <span className="text-4xl">
                      {WEAPON_EMOJIS[battleResult.enemyWeapon.type] ?? "⚔️"}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">+{battleResult.enemyWeapon.level}</p>
                    <p className="text-xs text-gray-500">{battleResult.enemyWeapon.nickname}</p>
                  </div>
                </div>

                {/* 보상 */}
                {battleResult.result === "WIN" && battleResult.goldEarned > 0 && (
                  <div className="text-center mb-5 p-3 bg-yellow-900/30 rounded-lg border border-yellow-500/50">
                    <p className="text-sm text-gray-400">획득 골드</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      +{battleResult.goldEarned.toLocaleString()}G
                    </p>
                  </div>
                )}

                {/* 닫기 버튼 */}
                <Button
                  className={`w-full font-bold ${
                    battleResult.result === "WIN"
                      ? "bg-green-600 hover:bg-green-500"
                      : "bg-red-600 hover:bg-red-500"
                  }`}
                  size="lg"
                  onClick={closeResult}
                >
                  확인
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes popup {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-popup {
          animation: popup 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
