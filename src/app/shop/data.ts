// 골드 상품
export const GOLD_PRODUCTS = [
  { id: "gold_small", name: "소형 골드 팩", price: "$1", gold: 10000, bonus: 0, field: "purchased_gold_small" },
  { id: "gold_medium", name: "중형 골드 팩", price: "$3", gold: 50000, bonus: 0, field: "purchased_gold_medium" },
  { id: "gold_large", name: "대형 골드 팩", price: "$20", gold: 100000, bonus: 0, field: "purchased_gold_large" },
];

// 파괴 방지권 상품
export const PROTECTION_PRODUCTS = [
  {
    id: "prot_low",
    name: "파괴 방지권 (하)",
    price: "$3",
    count: 5,
    maxLevel: 10,
    description: "10강 이하 강화 시 사용 가능",
    effectDescription: "파괴를 방지합니다. 강화단계가 유지됩니다.",
    field: "purchased_prot_low",
    inventoryField: "protection_low"
  },
  {
    id: "prot_mid",
    name: "파괴 방지권 (중)",
    price: "$5",
    count: 5,
    maxLevel: 15,
    description: "15강 이하 강화 시 사용 가능",
    effectDescription: "파괴를 방지합니다. 강화단계가 유지됩니다.",
    field: "purchased_prot_mid",
    inventoryField: "protection_mid"
  },
  {
    id: "prot_high",
    name: "파괴 방지권 (상)",
    price: "$10",
    count: 5,
    minLevel: 15,
    description: "15강 이상 강화 시 사용 가능",
    effectDescription: "파괴를 방지합니다. 강화단계가 -1됩니다.",
    field: "purchased_prot_high",
    inventoryField: "protection_high"
  },
];
