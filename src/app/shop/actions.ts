"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Profile } from "@/types/database";
import { GOLD_PRODUCTS, PROTECTION_PRODUCTS } from "./data";

// ============================================
// 골드 상품 수령
// ============================================
export async function claimGoldProduct(productId: string): Promise<{
  success: boolean;
  message: string;
  goldEarned?: number;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  const product = GOLD_PRODUCTS.find(p => p.id === productId);
  if (!product) {
    return { success: false, message: "존재하지 않는 상품입니다." };
  }

  // 프로필 조회
  const { data: profileData, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    return { success: false, message: "프로필을 찾을 수 없습니다." };
  }

  const profile = profileData as Profile;

  // 이미 수령했는지 확인
  if ((profile as Record<string, boolean>)[product.field]) {
    return { success: false, message: "이미 수령한 상품입니다." };
  }

  // 골드 지급
  const totalGold = product.gold + (product.bonus ?? 0);

  const { error: updateError } = await db
    .from("profiles")
    .update({
      gold: profile.gold + totalGold,
      [product.field]: true,
    })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, message: "상품 수령 중 오류가 발생했습니다." };
  }

  revalidatePath("/shop");
  revalidatePath("/upgrade");
  revalidatePath("/");

  return {
    success: true,
    message: `${product.name}을(를) 수령했습니다! +${totalGold.toLocaleString()}G`,
    goldEarned: totalGold,
  };
}

// ============================================
// 파괴 방지권 상품 수령
// ============================================
export async function claimProtectionProduct(productId: string): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  const product = PROTECTION_PRODUCTS.find(p => p.id === productId);
  if (!product) {
    return { success: false, message: "존재하지 않는 상품입니다." };
  }

  // 프로필 조회
  const { data: profileData, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    return { success: false, message: "프로필을 찾을 수 없습니다." };
  }

  const profile = profileData as Profile;

  // 이미 수령했는지 확인
  if ((profile as Record<string, boolean>)[product.field]) {
    return { success: false, message: "이미 수령한 상품입니다." };
  }

  // 파괴 방지권 지급
  const currentCount = (profile as Record<string, number>)[product.inventoryField] ?? 0;

  const { error: updateError } = await db
    .from("profiles")
    .update({
      [product.inventoryField]: currentCount + product.count,
      [product.field]: true,
    })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, message: "상품 수령 중 오류가 발생했습니다." };
  }

  revalidatePath("/shop");
  revalidatePath("/upgrade");

  return {
    success: true,
    message: `${product.name} ${product.count}개를 수령했습니다!`,
    count: product.count,
  };
}
