"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { claimGoldProduct, claimProtectionProduct } from "./actions";
import { GOLD_PRODUCTS, PROTECTION_PRODUCTS } from "./data";

interface ShopItemsProps {
  purchasedGoldSmall: boolean;
  purchasedGoldMedium: boolean;
  purchasedGoldLarge: boolean;
  purchasedProtLow: boolean;
  purchasedProtMid: boolean;
  purchasedProtHigh: boolean;
}

export default function ShopItems({
  purchasedGoldSmall,
  purchasedGoldMedium,
  purchasedGoldLarge,
  purchasedProtLow,
  purchasedProtMid,
  purchasedProtHigh,
}: ShopItemsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 구매 상태 맵
  const purchaseStatus: Record<string, boolean> = {
    gold_small: purchasedGoldSmall,
    gold_medium: purchasedGoldMedium,
    gold_large: purchasedGoldLarge,
    prot_low: purchasedProtLow,
    prot_mid: purchasedProtMid,
    prot_high: purchasedProtHigh,
  };

  const handleClaimGold = async (productId: string) => {
    if (isLoading || purchaseStatus[productId]) return;

    setIsLoading(productId);
    setMessage(null);

    try {
      const result = await claimGoldProduct(productId);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch {
      setMessage({ type: "error", text: "오류가 발생했습니다." });
    } finally {
      setIsLoading(null);
    }
  };

  const handleClaimProtection = async (productId: string) => {
    if (isLoading || purchaseStatus[productId]) return;

    setIsLoading(productId);
    setMessage(null);

    try {
      const result = await claimProtectionProduct(productId);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch {
      setMessage({ type: "error", text: "오류가 발생했습니다." });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <>
      {/* 메시지 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === "success"
            ? "bg-green-900/30 border border-green-500 text-green-400"
            : "bg-red-900/30 border border-red-500 text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      {/* 골드 상품 */}
      <Card>
        <CardHeader>
          <CardTitle>골드 충전</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {GOLD_PRODUCTS.map((product) => {
              const isPurchased = purchaseStatus[product.id];
              const isCurrentLoading = isLoading === product.id;

              return (
                <div
                  key={product.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isPurchased
                      ? "bg-gray-800/50 border-gray-700 opacity-60"
                      : "bg-gray-800 border-gray-700 hover:border-yellow-500"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-white">{product.name}</p>
                    <span className="text-xs text-gray-500">{product.price}</span>
                  </div>
                  <p className="text-2xl text-yellow-400 mb-1">
                    {product.gold.toLocaleString()}G
                  </p>
                  {product.bonus > 0 ? (
                    <p className="text-sm text-green-400 mb-3">
                      +{product.bonus.toLocaleString()}G 보너스
                    </p>
                  ) : (
                    <div className="mb-3" />
                  )}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleClaimGold(product.id)}
                    disabled={isPurchased || isCurrentLoading}
                  >
                    {isCurrentLoading
                      ? "수령 중..."
                      : isPurchased
                      ? "수령 완료"
                      : "무료로 받기 (1회)"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 파괴 방지권 상품 */}
      <Card>
        <CardHeader>
          <CardTitle>파괴 방지권</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PROTECTION_PRODUCTS.map((product) => {
              const isPurchased = purchaseStatus[product.id];
              const isCurrentLoading = isLoading === product.id;

              // 등급별 색상
              const colorClass = product.id === "prot_low"
                ? "text-green-400 border-green-500/30"
                : product.id === "prot_mid"
                ? "text-blue-400 border-blue-500/30"
                : "text-purple-400 border-purple-500/30";

              const bgClass = product.id === "prot_low"
                ? "bg-green-900/10"
                : product.id === "prot_mid"
                ? "bg-blue-900/10"
                : "bg-purple-900/10";

              return (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isPurchased ? "bg-gray-800/50 border-gray-700 opacity-60" : `${bgClass} ${colorClass}`
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-bold ${isPurchased ? "text-gray-400" : colorClass}`}>
                        {product.name}
                      </p>
                      <span className="text-xs text-gray-500">{product.price}</span>
                    </div>
                    <p className="text-sm text-gray-400">{product.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{product.effectDescription}</p>
                    <p className="text-xs text-gray-500 mt-1">{product.count}개 지급</p>
                  </div>
                  <div className="ml-4">
                    <Button
                      size="sm"
                      variant={isPurchased ? "ghost" : "secondary"}
                      onClick={() => handleClaimProtection(product.id)}
                      disabled={isPurchased || isCurrentLoading}
                    >
                      {isCurrentLoading
                        ? "수령 중..."
                        : isPurchased
                        ? "수령 완료"
                        : "무료로 받기"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
