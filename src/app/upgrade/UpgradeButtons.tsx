"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { attemptUpgrade, sellWeapon, setNickname } from "./actions";

// ============================================
// 결과 메시지 모음
// ============================================

// 실패/유지 시 안타까움 메시지 (10개)
const FAIL_MESSAGES = [
  "아쉽네요... 다음엔 꼭 성공할 거예요!",
  "강화의 신이 외면했습니다...",
  "운이 따라주지 않았네요.",
  "괜찮아요, 누구나 실패할 수 있어요.",
  "조금만 더 힘내세요!",
  "이것도 경험입니다...",
  "실패는 성공의 어머니!",
  "다음 강화가 기대됩니다.",
  "오늘은 운이 없는 날인가 봐요.",
  "포기하지 마세요!",
];

// 농담 섞인 안타까움 (3개)
const FAIL_JOKE_MESSAGES = [
  "강화석이 튕겨나갔습니다... 튕! 튕!",
  "무기가 '싫어요'라고 말하는 것 같아요.",
  "확률은 확률일 뿐... 믿으면 안 됩니다.",
];

// 조롱 메시지 (2개)
const FAIL_MOCK_MESSAGES = [
  "하하... 그럴 줄 알았어요.",
  "역시 기대를 저버리지 않네요!",
];

// 성공 축하 메시지 (10개)
const SUCCESS_MESSAGES = [
  "축하합니다! 대단해요!",
  "강화 성공! 운이 따라주네요!",
  "멋져요! 최고의 선택이었어요!",
  "빛나는 성공! 계속 달려보세요!",
  "성공! 오늘 로또 사세요!",
  "강화의 신이 함께합니다!",
  "완벽한 강화! 감탄이 절로 나와요!",
  "대박! 이 기세를 몰아가세요!",
  "성공이다! 파티 타임!",
  "훌륭해요! 전설이 되어가고 있어요!",
];

// 파괴 시 메시지
const DESTROY_MESSAGES = [
  "무기가 산산조각 났습니다...",
  "처참한 파괴... 새 출발입니다.",
  "꽝! 무기가 사라졌습니다...",
  "강화의 저주가 내렸습니다...",
  "무기: '안녕히 계세요...'",
];

// 대장장이 강화 중 메시지 (20개)
const BLACKSMITH_MESSAGES = [
  "대장장이가 모루 위에 무기를 올려놓았다.",
  "용광로의 불길이 활활 타오른다.",
  "대장장이가 이마의 땀을 닦는다.",
  "망치 소리가 대장간에 울려 퍼진다.",
  "무기에 강화석 가루를 뿌리는 중이다.",
  "대장장이가 칼날의 상태를 점검한다.",
  "강화의 기운이 무기에 스며들고 있다.",
  "대장장이가 집중하며 숨을 고른다.",
  "불꽃이 튀며 무기가 붉게 달아오른다.",
  "대장장이가 주문을 읊조린다.",
  "무기에서 묘한 진동이 느껴진다.",
  "강화석이 무기와 하나가 되어간다.",
  "대장장이의 눈빛이 날카로워진다.",
  "무기가 서서히 빛을 내기 시작한다.",
  "대장장이가 마지막 담금질을 준비한다.",
  "용광로의 온도를 미세하게 조절하고 있다.",
  "대장장이가 무기의 균형을 잡고 있다.",
  "강화의 기운이 임계점에 다가간다.",
  "대장장이가 망치를 힘껏 내려친다!",
  "결과가 곧 나온다... 두근두근.",
];

// 랜덤 메시지 선택
const getRandomMessage = (messages: string[]) => {
  return messages[Math.floor(Math.random() * messages.length)];
};

// 실패 메시지 (10 + 3 + 2 중 랜덤)
const getFailMessage = () => {
  const allMessages = [...FAIL_MESSAGES, ...FAIL_JOKE_MESSAGES, ...FAIL_MOCK_MESSAGES];
  return getRandomMessage(allMessages);
};

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

interface UpgradeButtonsProps {
  currentLevel: number;
  gold: number;
  upgradeCost: number;
  canUpgrade: boolean;
  canSell: boolean;
  sellPriceMin: number;
  sellPriceMax: number;
  weaponName: string;
  weaponDescription: string | null;
  weaponType: string;
  nickname: string | null;
  protectionLow: number;
  protectionMid: number;
  protectionHigh: number;
}

interface PopupData {
  type: "SUCCESS" | "MAINTAIN" | "DESTROY" | "SELL" | "PROTECTED";
  title: string;
  message: string;
  subMessage: string;
  weaponInfo?: {
    name: string;
    description: string | null;
    level: number;
    emoji: string;
    type: string;
  };
}

interface LastResultData {
  type: "SUCCESS" | "MAINTAIN" | "DESTROY" | "SELL" | null;
  message: string;
  weaponInfo?: {
    name: string;
    description: string | null;
    level: number;
    emoji: string;
  };
}

export default function UpgradeButtons({
  currentLevel,
  gold,
  upgradeCost,
  canUpgrade,
  canSell,
  sellPriceMin,
  sellPriceMax,
  weaponName,
  weaponDescription,
  weaponType,
  nickname,
  protectionLow,
  protectionMid,
  protectionHigh,
}: UpgradeButtonsProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [lastResult, setLastResult] = useState<LastResultData | null>(null);
  const [selectedProtection, setSelectedProtection] = useState<"low" | "mid" | "high" | null>(null);
  const [smithMessage, setSmithMessage] = useState(BLACKSMITH_MESSAGES[0]);

  // 강화 중일 때 대장장이 메시지 순환
  useEffect(() => {
    if (!isUpgrading) return;
    setSmithMessage(BLACKSMITH_MESSAGES[0]);
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % BLACKSMITH_MESSAGES.length;
      setSmithMessage(BLACKSMITH_MESSAGES[idx]);
    }, 1200);
    return () => clearInterval(timer);
  }, [isUpgrading]);

  // 사용 가능한 파괴 방지권 확인
  const canUseLow = protectionLow > 0 && currentLevel <= 10;
  const canUseMid = protectionMid > 0 && currentLevel <= 15;
  const canUseHigh = protectionHigh > 0 && currentLevel >= 15;
  const [popup, setPopup] = useState<PopupData | null>(null);

  // 닉네임 설정 팝업
  const [showNicknamePopup, setShowNicknamePopup] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  // 닉네임이 없으면 팝업 표시
  useEffect(() => {
    if (!nickname) {
      setShowNicknamePopup(true);
    }
  }, [nickname]);

  // 닉네임 저장
  const handleSaveNickname = async () => {
    if (isSavingNickname) return;

    const trimmed = nicknameInput.trim();
    if (trimmed.length < 1 || trimmed.length > 6) {
      setNicknameError("닉네임은 1~6자 사이로 입력해주세요.");
      return;
    }

    setIsSavingNickname(true);
    setNicknameError("");

    try {
      const result = await setNickname(trimmed);
      if (result.success) {
        setShowNicknamePopup(false);
      } else {
        setNicknameError(result.message);
      }
    } catch {
      setNicknameError("닉네임 설정 중 오류가 발생했습니다.");
    } finally {
      setIsSavingNickname(false);
    }
  };

  // 강화 시도
  const handleUpgrade = async () => {
    if (isUpgrading || !canUpgrade) return;

    setIsUpgrading(true);
    setLastResult(null);

    try {
      const result = await attemptUpgrade(selectedProtection);
      setSelectedProtection(null); // 강화 후 선택 초기화

      if (result.success && result.result) {
        const weaponEmoji = getWeaponEmoji(weaponType);
        const isProtectionSaved = result.message.includes("방지권 발동");
        const newLevel = result.newLevel ?? currentLevel;

        // 간단한 결과 메시지 (버튼 위)
        setLastResult({
          type: result.result,
          message: result.message,
          weaponInfo: result.result !== "DESTROY" ? {
            name: weaponName,
            description: weaponDescription,
            level: newLevel,
            emoji: weaponEmoji,
          } : undefined,
        });

        // 팝업 데이터 설정
        let popupData: PopupData;

        if (result.result === "SUCCESS") {
          popupData = {
            type: "SUCCESS",
            title: "강화 성공!",
            message: getRandomMessage(SUCCESS_MESSAGES),
            subMessage: `+${currentLevel} → +${newLevel}`,
            weaponInfo: {
              name: result.newWeaponName ?? weaponName,
              description: result.newWeaponDescription ?? weaponDescription,
              level: newLevel,
              emoji: weaponEmoji,
              type: weaponType,
            },
          };
        } else if (result.result === "MAINTAIN") {
          if (isProtectionSaved) {
            // 파괴 방지권으로 구출된 경우 - 보라색 팝업
            popupData = {
              type: "PROTECTED",
              title: "파괴 방지!",
              message: "파괴 방지권 덕분에 무기가 파괴되지 않았습니다!",
              subMessage: newLevel < currentLevel
                ? `+${currentLevel} → +${newLevel} (1단계 하락)`
                : `+${currentLevel} 유지`,
              weaponInfo: {
                name: weaponName,
                description: weaponDescription,
                level: newLevel,
                emoji: weaponEmoji,
                type: weaponType,
              },
            };
          } else {
            // 일반 유지
            popupData = {
              type: "MAINTAIN",
              title: "강화 실패",
              message: getFailMessage(),
              subMessage: `+${currentLevel} 유지`,
              weaponInfo: {
                name: weaponName,
                description: weaponDescription,
                level: newLevel,
                emoji: weaponEmoji,
                type: weaponType,
              },
            };
          }
        } else {
          // DESTROY
          popupData = {
            type: "DESTROY",
            title: "무기 파괴!",
            message: getRandomMessage(DESTROY_MESSAGES),
            subMessage: result.message,
          };
        }

        setPopup(popupData);
      } else {
        setLastResult({
          type: null,
          message: result.message,
        });
      }
    } catch {
      setLastResult({
        type: null,
        message: "강화 중 오류가 발생했습니다.",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  // 무기 판매
  const handleSell = async () => {
    if (isSelling || !canSell) return;

    const confirmed = window.confirm(
      `정말로 +${currentLevel} 무기를 판매하시겠습니까?\n판매 후 0강 랜덤 무기로 다시 시작합니다.`
    );

    if (!confirmed) return;

    setIsSelling(true);
    setLastResult(null);

    try {
      const result = await sellWeapon();

      setLastResult({
        type: result.success ? "SELL" : null,
        message: result.message,
      });

      if (result.success) {
        setPopup({
          type: "SELL",
          title: "판매 완료!",
          message: `+${currentLevel} 무기를 판매했습니다.`,
          subMessage: `+${result.goldEarned?.toLocaleString()}G 획득!`,
        });
      }
    } catch {
      setLastResult({
        type: null,
        message: "판매 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSelling(false);
    }
  };

  // 팝업 닫기
  const closePopup = () => {
    setPopup(null);
  };

  // 결과 테두리 색상
  const getResultBorderColor = () => {
    if (!lastResult) return "";
    switch (lastResult.type) {
      case "SUCCESS":
        return "border-green-500";
      case "MAINTAIN":
        return "border-yellow-500";
      case "DESTROY":
        return "border-red-500";
      case "SELL":
        return "border-blue-500";
      default:
        return "border-gray-600";
    }
  };

  // 결과 배경 그라데이션
  const getResultBgGradient = () => {
    if (!lastResult) return "";
    switch (lastResult.type) {
      case "SUCCESS":
        return "bg-gradient-to-r from-green-900/40 via-green-800/20 to-green-900/40";
      case "MAINTAIN":
        return "bg-gradient-to-r from-yellow-900/40 via-yellow-800/20 to-yellow-900/40";
      case "DESTROY":
        return "bg-gradient-to-r from-red-900/40 via-red-800/20 to-red-900/40";
      case "SELL":
        return "bg-gradient-to-r from-blue-900/40 via-blue-800/20 to-blue-900/40";
      default:
        return "bg-gray-800/50";
    }
  };

  // 결과 텍스트 색상
  const getResultTextColor = () => {
    if (!lastResult) return "";
    switch (lastResult.type) {
      case "SUCCESS":
        return "text-green-400";
      case "MAINTAIN":
        return "text-yellow-400";
      case "DESTROY":
        return "text-red-400";
      case "SELL":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* 결과 메시지 (버튼 위) - 개선된 디자인 */}
        {lastResult && (
          <div className={`relative overflow-hidden rounded-xl border-2 ${getResultBorderColor()} ${getResultBgGradient()} p-5`}>
            {/* 배경 이펙트 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-white rounded-full blur-2xl" />
            </div>

            <div className="relative z-10">
              {/* 결과 타입 배지 */}
              <div className="flex justify-center mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  lastResult.type === "SUCCESS" ? "bg-green-500/30 text-green-300" :
                  lastResult.type === "MAINTAIN" ? "bg-yellow-500/30 text-yellow-300" :
                  lastResult.type === "DESTROY" ? "bg-red-500/30 text-red-300" :
                  lastResult.type === "SELL" ? "bg-blue-500/30 text-blue-300" :
                  "bg-gray-500/30 text-gray-300"
                }`}>
                  {lastResult.type === "SUCCESS" ? "성공" :
                   lastResult.type === "MAINTAIN" ? "유지" :
                   lastResult.type === "DESTROY" ? "파괴" :
                   lastResult.type === "SELL" ? "판매" : "알림"}
                </span>
              </div>

              {/* 메인 메시지 */}
              <p className={`text-center font-bold text-lg ${getResultTextColor()}`}>
                {lastResult.message}
              </p>

              {/* 무기 정보 (성공/유지 시) */}
              {lastResult.weaponInfo && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl">{lastResult.weaponInfo.emoji}</span>
                    <div className="text-left">
                      <p className="text-white font-bold">
                        {lastResult.weaponInfo.name}
                      </p>
                      {lastResult.weaponInfo.description && (
                        <p className="text-gray-400 text-sm mt-1 italic">
                          &quot;{lastResult.weaponInfo.description}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 파괴 방지권 선택 */}
        {currentLevel > 0 && currentLevel < 20 && (
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-sm text-gray-400 mb-3">파괴 방지권 사용</p>
            <div className="flex flex-wrap gap-2">
              {/* 사용 안함 */}
              <button
                onClick={() => setSelectedProtection(null)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedProtection === null
                    ? "bg-gray-600 text-white"
                    : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                }`}
              >
                사용 안함
              </button>

              {/* 파괴 방지권 (하) */}
              <button
                onClick={() => canUseLow && setSelectedProtection("low")}
                disabled={!canUseLow}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !canUseLow
                    ? "bg-gray-800/30 text-gray-600 cursor-not-allowed"
                    : selectedProtection === "low"
                    ? "bg-green-600 text-white"
                    : "bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-500/30"
                }`}
              >
                하급 ({protectionLow})
              </button>

              {/* 파괴 방지권 (중) */}
              <button
                onClick={() => canUseMid && setSelectedProtection("mid")}
                disabled={!canUseMid}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !canUseMid
                    ? "bg-gray-800/30 text-gray-600 cursor-not-allowed"
                    : selectedProtection === "mid"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-500/30"
                }`}
              >
                중급 ({protectionMid})
              </button>

              {/* 파괴 방지권 (상) */}
              <button
                onClick={() => canUseHigh && setSelectedProtection("high")}
                disabled={!canUseHigh}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !canUseHigh
                    ? "bg-gray-800/30 text-gray-600 cursor-not-allowed"
                    : selectedProtection === "high"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 border border-purple-500/30"
                }`}
              >
                고급 ({protectionHigh})
              </button>
            </div>

            {/* 선택된 방지권 효과 설명 */}
            {selectedProtection && (
              <p className="text-xs text-gray-500 mt-2">
                {selectedProtection === "high"
                  ? "파괴를 방지합니다. 강화단계가 -1됩니다."
                  : "파괴를 방지합니다. 강화단계가 유지됩니다."}
              </p>
            )}
          </div>
        )}

        {/* 강화 중 로딩 UI */}
        {isUpgrading ? (
          <div className="rounded-xl bg-gray-800 border border-gray-700 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce-slow">🔨</span>
              <p className="text-white font-medium text-sm transition-opacity duration-300">
                {smithMessage}
              </p>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 rounded-full animate-smith-bar" />
            </div>
          </div>
        ) : (
          <>
            {/* 강화 버튼 */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleUpgrade}
              disabled={!canUpgrade || currentLevel >= 20}
            >
              {currentLevel >= 20 ? (
                "최고 단계 달성!"
              ) : gold < upgradeCost ? (
                `골드 부족 (${upgradeCost.toLocaleString()}G 필요)`
              ) : (
                `강화하기 (-${upgradeCost.toLocaleString()}G)`
              )}
            </Button>

            {/* 판매 버튼 */}
            <Button
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={handleSell}
              disabled={!canSell || isSelling}
            >
              {isSelling ? (
                "판매 중..."
              ) : !canSell ? (
                "0강은 판매 불가"
              ) : (
                "무기 판매"
              )}
            </Button>
          </>
        )}
      </div>

      {/* 결과 팝업 - 개선된 디자인 */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closePopup}
        >
          {/* 배경 오버레이 with 블러 */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* 팝업 컨테이너 */}
          <div
            className={`relative w-full max-w-md transform transition-all duration-300 ease-out animate-popup`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 글로우 이펙트 */}
            <div className={`absolute -inset-1 rounded-3xl blur-xl opacity-50 ${
              popup.type === "SUCCESS" ? "bg-green-500" :
              popup.type === "MAINTAIN" ? "bg-yellow-500" :
              popup.type === "DESTROY" ? "bg-red-500" :
              popup.type === "PROTECTED" ? "bg-purple-500" :
              "bg-blue-500"
            }`} />

            {/* 메인 팝업 */}
            <div className={`relative overflow-hidden rounded-2xl border-2 ${
              popup.type === "SUCCESS" ? "border-green-400 bg-gradient-to-b from-green-900/95 via-gray-900/98 to-gray-900" :
              popup.type === "MAINTAIN" ? "border-yellow-400 bg-gradient-to-b from-yellow-900/95 via-gray-900/98 to-gray-900" :
              popup.type === "DESTROY" ? "border-red-400 bg-gradient-to-b from-red-900/95 via-gray-900/98 to-gray-900" :
              popup.type === "PROTECTED" ? "border-purple-400 bg-gradient-to-b from-purple-900/95 via-gray-900/98 to-gray-900" :
              "border-blue-400 bg-gradient-to-b from-blue-900/95 via-gray-900/98 to-gray-900"
            }`}>
              {/* 상단 장식 라인 */}
              <div className={`h-1 w-full ${
                popup.type === "SUCCESS" ? "bg-gradient-to-r from-transparent via-green-400 to-transparent" :
                popup.type === "MAINTAIN" ? "bg-gradient-to-r from-transparent via-yellow-400 to-transparent" :
                popup.type === "DESTROY" ? "bg-gradient-to-r from-transparent via-red-400 to-transparent" :
                popup.type === "PROTECTED" ? "bg-gradient-to-r from-transparent via-purple-400 to-transparent" :
                "bg-gradient-to-r from-transparent via-blue-400 to-transparent"
              }`} />

              <div className="p-6">
                {/* 이모지 아이콘 with 애니메이션 효과 */}
                <div className="text-center mb-4">
                  <div className={`inline-block p-4 rounded-full ${
                    popup.type === "SUCCESS" ? "bg-green-500/20" :
                    popup.type === "MAINTAIN" ? "bg-yellow-500/20" :
                    popup.type === "DESTROY" ? "bg-red-500/20" :
                    popup.type === "PROTECTED" ? "bg-purple-500/20" :
                    "bg-blue-500/20"
                  }`}>
                    <span className="text-6xl block animate-bounce-slow">
                      {popup.type === "SUCCESS" && "🎉"}
                      {popup.type === "MAINTAIN" && "😢"}
                      {popup.type === "DESTROY" && "💥"}
                      {popup.type === "SELL" && "💰"}
                      {popup.type === "PROTECTED" && "🛡️"}
                    </span>
                  </div>
                </div>

                {/* 타이틀 */}
                <h2 className={`text-3xl font-black text-center mb-3 tracking-tight ${
                  popup.type === "SUCCESS" ? "text-green-400" :
                  popup.type === "MAINTAIN" ? "text-yellow-400" :
                  popup.type === "DESTROY" ? "text-red-400" :
                  popup.type === "PROTECTED" ? "text-purple-400" :
                  "text-blue-400"
                }`}>
                  {popup.title}
                </h2>

                {/* 메인 메시지 */}
                <p className="text-center text-white text-lg font-medium mb-2">
                  {popup.message}
                </p>

                {/* 서브 메시지 - 레벨 변화 표시 */}
                <div className="flex justify-center items-center gap-2 mb-5">
                  <span className={`text-xl font-bold ${
                    popup.type === "SUCCESS" ? "text-green-300" :
                    popup.type === "MAINTAIN" ? "text-yellow-300" :
                    popup.type === "DESTROY" ? "text-red-300" :
                    popup.type === "PROTECTED" ? "text-purple-300" :
                    "text-blue-300"
                  }`}>
                    {popup.subMessage}
                  </span>
                </div>

                {/* 무기 정보 카드 (성공/유지/방어 시) */}
                {popup.weaponInfo && (
                  <div className={`relative overflow-hidden rounded-xl border ${
                    popup.type === "SUCCESS" ? "border-green-500/50 bg-green-950/50" :
                    popup.type === "PROTECTED" ? "border-purple-500/50 bg-purple-950/50" :
                    "border-yellow-500/50 bg-yellow-950/50"
                  } p-5 mb-5`}>
                    {/* 무기 카드 배경 패턴 */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)`,
                        backgroundSize: '10px 10px'
                      }} />
                    </div>

                    <div className="relative z-10">
                      {/* 무기 이모지 */}
                      <div className="text-center mb-3">
                        <span className="text-5xl drop-shadow-lg">{popup.weaponInfo.emoji}</span>
                      </div>

                      {/* 무기 이름 & 레벨 */}
                      <div className="text-center">
                        <p className={`text-sm font-medium uppercase tracking-wider mb-1 ${
                          popup.type === "SUCCESS" ? "text-green-400" :
                          popup.type === "PROTECTED" ? "text-purple-400" :
                          "text-yellow-400"
                        }`}>
                          {popup.weaponInfo.type}
                        </p>
                        <p className="text-2xl font-black text-white">
                          {popup.weaponInfo.name}
                        </p>
                      </div>

                      {/* 무기 설명 */}
                      {popup.weaponInfo.description && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-center text-gray-300 text-sm leading-relaxed italic">
                            &quot;{popup.weaponInfo.description}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 닫기 버튼 */}
                <Button
                  className={`w-full font-bold ${
                    popup.type === "SUCCESS" ? "bg-green-600 hover:bg-green-500" :
                    popup.type === "MAINTAIN" ? "bg-yellow-600 hover:bg-yellow-500" :
                    popup.type === "DESTROY" ? "bg-red-600 hover:bg-red-500" :
                    popup.type === "PROTECTED" ? "bg-purple-600 hover:bg-purple-500" :
                    "bg-blue-600 hover:bg-blue-500"
                  }`}
                  size="lg"
                  onClick={closePopup}
                >
                  확인
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 닉네임 설정 팝업 */}
      {showNicknamePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

          {/* 팝업 컨테이너 */}
          <div className="relative w-full max-w-md animate-popup">
            {/* 글로우 이펙트 */}
            <div className="absolute -inset-1 rounded-3xl blur-xl opacity-50 bg-purple-500" />

            {/* 메인 팝업 */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-purple-400 bg-gradient-to-b from-purple-900/95 via-gray-900/98 to-gray-900">
              {/* 상단 장식 라인 */}
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

              <div className="p-6">
                {/* 아이콘 */}
                <div className="text-center mb-4">
                  <div className="inline-block p-4 rounded-full bg-purple-500/20">
                    <span className="text-5xl block">👤</span>
                  </div>
                </div>

                {/* 타이틀 */}
                <h2 className="text-2xl font-black text-center mb-2 text-purple-400">
                  닉네임 설정
                </h2>

                {/* 설명 */}
                <p className="text-center text-gray-400 text-sm mb-5">
                  강화 기록에 표시될 닉네임을 설정해주세요!<br />
                  <span className="text-purple-300">1~6자</span>까지 입력 가능합니다.
                </p>

                {/* 입력 필드 */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => {
                      setNicknameInput(e.target.value);
                      setNicknameError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveNickname();
                      }
                    }}
                    placeholder="닉네임 입력"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border-2 border-gray-700 focus:border-purple-500 focus:outline-none text-white text-center text-lg font-bold placeholder-gray-500 transition-colors"
                  />
                  <div className="flex justify-between mt-2 px-1">
                    <span className={`text-xs ${nicknameError ? "text-red-400" : "text-gray-500"}`}>
                      {nicknameError || "한글, 영문, 숫자만 사용 가능"}
                    </span>
                    <span className={`text-xs ${nicknameInput.length > 6 ? "text-red-400" : "text-gray-500"}`}>
                      {nicknameInput.length}/6
                    </span>
                  </div>
                </div>

                {/* 확인 버튼 */}
                <Button
                  className="w-full font-bold bg-purple-600 hover:bg-purple-500"
                  size="lg"
                  onClick={handleSaveNickname}
                  disabled={isSavingNickname || nicknameInput.trim().length === 0}
                >
                  {isSavingNickname ? "저장 중..." : "확인"}
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
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        @keyframes smith-bar {
          0% {
            width: 0%;
          }
          50% {
            width: 80%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-smith-bar {
          animation: smith-bar 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
