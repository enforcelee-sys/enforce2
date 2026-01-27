"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface HuntingClientProps {
  isHunting: boolean;
  huntingStartedAt: string | null;
  currentLevel: number;
  keys: number;
}

interface HuntResult {
  success: boolean;
  rewardType: string;
  rewardAmount: number;
  message: string;
  newKeys?: number;
  newLevel?: number;
  levelUp?: boolean;
}

export default function HuntingClient({
  isHunting: initialIsHunting,
  huntingStartedAt,
  currentLevel,
  keys,
}: HuntingClientProps) {
  const router = useRouter();
  const [isHunting, setIsHunting] = useState(initialIsHunting);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HuntResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 초기 카운트다운 설정
  useEffect(() => {
    if (isHunting && huntingStartedAt) {
      const startedAt = new Date(huntingStartedAt).getTime();
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 5000 - elapsed);
      setCountdown(Math.ceil(remaining / 1000));
    }
  }, [isHunting, huntingStartedAt]);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 사냥 완료 - 결과 가져오기
          completeHunt();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // 사냥 완료 처리
  const completeHunt = useCallback(async () => {
    try {
      const response = await fetch("/api/hunt", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setResult(data);
        setShowResult(true);
      } else {
        console.error("Hunt failed:", data.error);
      }
    } catch (error) {
      console.error("Hunt error:", error);
    } finally {
      setIsHunting(false);
      setCountdown(0);
    }
  }, []);

  // 사냥 시작
  const startHunt = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/hunt", { method: "PUT" });
      const data = await response.json();

      if (data.success) {
        setIsHunting(true);
        setCountdown(5);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Hunt start error:", error);
      alert("사냥 시작 실패");
    } finally {
      setLoading(false);
    }
  };

  // 결과 모달 닫기
  const closeResult = () => {
    setShowResult(false);
    setResult(null);
    router.refresh();
  };

  // 보상 타입별 아이콘
  const getRewardIcon = (type: string) => {
    switch (type) {
      case "GOLD": return "💰";
      case "KEY": return "🔑";
      case "PROTECTION_LOW": return "🛡️";
      case "PROTECTION_MID": return "🛡️";
      case "PROTECTION_HIGH": return "🛡️";
      default: return "🎁";
    }
  };

  // 보상 타입별 색상
  const getRewardColor = (type: string) => {
    switch (type) {
      case "GOLD": return "text-yellow-400";
      case "KEY": return "text-blue-400";
      case "PROTECTION_LOW": return "text-green-400";
      case "PROTECTION_MID": return "text-blue-400";
      case "PROTECTION_HIGH": return "text-purple-400";
      default: return "text-white";
    }
  };

  return (
    <>
      {/* 사냥 버튼 */}
      <div className="mt-4">
        {isHunting || countdown > 0 ? (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-4xl font-bold text-blue-400 animate-pulse">
                {countdown}
              </span>
            </div>
            <p className="text-gray-400">사냥 중...</p>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-1000"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <Button
            className="w-full py-4 text-lg"
            onClick={startHunt}
            disabled={loading}
          >
            {loading ? "준비 중..." : "⚔️ 사냥하기"}
          </Button>
        )}
      </div>

      {/* 결과 모달 */}
      {showResult && result && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white text-center mb-4">
              사냥 완료!
            </h3>

            <div className="text-center py-6">
              <span className="text-6xl block mb-4">
                {getRewardIcon(result.rewardType)}
              </span>
              <p className={`text-2xl font-bold ${getRewardColor(result.rewardType)}`}>
                {result.message}
              </p>
            </div>

            {result.levelUp && (
              <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500 rounded-lg text-center">
                <p className="text-blue-400 font-bold">
                  🎉 새로운 사냥터 해금!
                </p>
                <p className="text-white mt-1">
                  Lv.{result.newLevel} 사냥터 입장 가능
                </p>
              </div>
            )}

            <Button className="w-full" onClick={closeResult}>
              확인
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
