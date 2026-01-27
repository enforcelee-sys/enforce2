"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { checkIn } from "./actions";

interface CheckInButtonProps {
  canCheckin: boolean;
  remainingHours: number;
  lastCheckinAt: string | null;
}

export default function CheckInButton({ canCheckin, remainingHours, lastCheckinAt }: CheckInButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    goldEarned?: number;
    bonusGold?: number;
    streakDay?: number;
  } | null>(null);

  // 남은 시간 계산 (초 단위)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!lastCheckinAt) {
      setRemainingSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      const lastCheckin = new Date(lastCheckinAt);
      const nextCheckin = new Date(lastCheckin.getTime() + 4 * 60 * 60 * 1000); // 4시간 후
      const now = new Date();
      const diff = nextCheckin.getTime() - now.getTime();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setRemainingSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastCheckinAt, result]);

  // 시:분:초 포맷
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}시간 ${minutes.toString().padStart(2, "0")}분 ${seconds.toString().padStart(2, "0")}초`;
  };

  const handleCheckIn = async () => {
    if (isChecking || !canCheckin) return;

    setIsChecking(true);
    setResult(null);

    try {
      const response = await checkIn();
      setResult(response);
    } catch {
      setResult({ success: false, message: "출석 처리 중 오류가 발생했습니다." });
    } finally {
      setIsChecking(false);
    }
  };

  if (result?.success) {
    return (
      <div className="text-center">
        <div className="mb-4 p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <p className="text-green-400 text-lg font-bold mb-2">출석 완료!</p>
          <p className="text-2xl font-black text-yellow-400">
            +{result.goldEarned?.toLocaleString()}G
          </p>
          {result.bonusGold && result.bonusGold > 0 && (
            <p className="text-orange-400 font-bold mt-2">
              {result.streakDay}일 연속 보너스! +{result.bonusGold.toLocaleString()}G
            </p>
          )}
        </div>
        <div className="bg-gray-800/50 rounded-lg px-4 py-3 inline-block">
          <p className="text-xs text-gray-500 mb-1">다음 출석까지</p>
          <p className="text-xl font-mono font-bold text-yellow-400">
            {formatTime(remainingSeconds > 0 ? remainingSeconds : 4 * 60 * 60)}
          </p>
        </div>
      </div>
    );
  }

  if (!canCheckin && remainingSeconds > 0) {
    return (
      <div className="text-center">
        <p className="text-green-400 text-lg mb-2">출석 완료!</p>
        <div className="bg-gray-800/50 rounded-lg px-4 py-3 inline-block">
          <p className="text-xs text-gray-500 mb-1">다음 출석까지</p>
          <p className="text-2xl font-mono font-bold text-yellow-400">
            {formatTime(remainingSeconds)}
          </p>
        </div>
      </div>
    );
  }

  if (!canCheckin) {
    return (
      <div className="text-center">
        <p className="text-green-400 text-lg mb-2">출석 완료!</p>
        <p className="text-gray-400 text-sm">잠시 후 다시 출석 가능</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-yellow-400 text-lg mb-4">보상을 받으세요!</p>
      <p className="text-gray-400 text-sm mb-4">
        <span className="text-orange-400">5일 연속: +30만G / 7일 연속: +70만G</span>
      </p>
      {result && !result.success && (
        <p className="text-red-400 text-sm mb-4">{result.message}</p>
      )}
      <Button size="lg" onClick={handleCheckIn} disabled={isChecking}>
        {isChecking ? "출석 중..." : "출석 체크하기"}
      </Button>
    </div>
  );
}
