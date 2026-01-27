import { createClient } from "@/lib/supabase/server";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { Profile } from "@/types/database";
import ShopItems from "./ShopItems";

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 프로필 정보
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .single() as { data: Profile | null };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">상점</h1>

      {/* 보유 현황 */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">보유 골드</p>
              <p className="text-xl font-bold text-yellow-400">
                {(profile?.gold ?? 0).toLocaleString()}G
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">파괴 방지권</p>
              <p className="text-xl font-bold text-white">
                <span className="text-green-400">{profile?.protection_low ?? 0}</span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-blue-400">{profile?.protection_mid ?? 0}</span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-purple-400">{profile?.protection_high ?? 0}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상점 아이템 */}
      <ShopItems
        purchasedGoldSmall={profile?.purchased_gold_small ?? false}
        purchasedGoldMedium={profile?.purchased_gold_medium ?? false}
        purchasedGoldLarge={profile?.purchased_gold_large ?? false}
        purchasedProtLow={profile?.purchased_prot_low ?? false}
        purchasedProtMid={profile?.purchased_prot_mid ?? false}
        purchasedProtHigh={profile?.purchased_prot_high ?? false}
      />

      <p className="text-xs text-gray-500 text-center">
        * 현재 MVP 버전으로 모든 상품은 1회 무료 지급됩니다.
      </p>
    </div>
  );
}
