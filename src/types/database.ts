// ============================================
// Supabase 테이블 타입 정의
// 실제 DB 스키마(00001_init.sql)에 맞게 정의
// ============================================

export type UpgradeResult = "SUCCESS" | "MAINTAIN" | "DESTROY";
export type ActionType = "UPGRADE" | "SELL";
export type BattleResult = "WIN" | "LOSE";

// profiles 테이블 (유저 상태 통합)
export interface Profile {
  id: string;
  nickname: string | null;

  // 무기 상태
  weapon_type: string;
  weapon_concept: string;
  weapon_level: number;

  // 재화
  gold: number;

  // 출석 시스템
  last_checkin_at: string | null;
  today_checkin_count: number;
  today_checkin_gold: number;
  today_date: string | null;

  // 배틀 시스템
  battle_ticket: number;
  last_ticket_regen_at: string | null;
  total_wins: number;
  total_losses: number;

  // 파괴 방지권
  protection_low: number;
  protection_mid: number;
  protection_high: number;

  // 상점 구매 여부
  purchased_gold_small: boolean;
  purchased_gold_medium: boolean;
  purchased_gold_large: boolean;
  purchased_prot_low: boolean;
  purchased_prot_mid: boolean;
  purchased_prot_high: boolean;

  // 결제 관련
  total_spent_krw: number;
  first_purchase_done: boolean;

  // 칭호 슬롯
  title_slots: number;
  purchased_title_slots: number;

  // 강화 통계
  total_upgrades: number;
  total_successes: number;
  total_maintains: number;
  total_destroys: number;
  current_success_streak: number;
  max_success_streak: number;
  used_only_cash_items: boolean;
  used_only_gold: boolean;

  // 무기별 최고 강화 기록
  best_sword_level: number;
  best_bow_level: number;
  best_staff_level: number;
  best_shield_level: number;
  best_club_level: number;

  // 무기별 파괴 횟수
  sword_destroy_count: number;
  bow_destroy_count: number;
  staff_destroy_count: number;
  shield_destroy_count: number;
  club_destroy_count: number;

  // 사냥터 시스템
  current_hunting_level: number;
  hunting_keys: number;
  is_hunting: boolean;
  hunting_started_at: string | null;

  created_at: string;
}

// weapon_descriptions 테이블 (무기 이름/설명 마스터)
export interface WeaponDescription {
  id: string;
  weapon_type: string;
  concept: string;
  level: number;
  name: string;
  description: string | null;
  created_at: string;
}

// titles 테이블 (칭호 마스터)
export interface Title {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  condition_type: string;
  condition_weapon: string | null;
  condition_value: number | null;
  reward_gold: number;
  created_at: string;
}

// user_titles 테이블 (유저 보유 칭호)
export interface UserTitle {
  id: string;
  user_id: string;
  title_id: string;
  is_equipped: boolean;
  equipped_slot: number | null;
  acquired_at: string;
  // 조인 데이터
  title?: Title;
}

// upgrade_logs 테이블 (강화/판매 기록)
export interface UpgradeLog {
  id: string;
  user_id: string;
  nickname: string | null;
  action: ActionType;
  weapon_type: string;
  weapon_concept: string;
  weapon_name: string | null;
  weapon_description: string | null;
  from_level: number;
  to_level: number | null;
  result: UpgradeResult | null;
  gold_change: number;
  used_protection: string | null;
  created_at: string;
}

// battle_logs 테이블 (배틀 기록)
export interface BattleLog {
  id: string;
  user_id: string;
  my_weapon_type: string;
  my_weapon_concept: string;
  my_weapon_level: number;
  my_weapon_name: string | null;
  opponent_weapon_type: string;
  opponent_weapon_concept: string;
  opponent_weapon_level: number;
  opponent_weapon_name: string | null;
  win_rate: number;
  matchup_bonus: number;
  result: BattleResult;
  gold_earned: number;
  battle_message: string | null;
  created_at: string;
}

// checkin_logs 테이블 (출석 기록)
export interface CheckinLog {
  id: string;
  user_id: string;
  reward_gold: number;
  checked_in_at: string;
}

// hunting_grounds 테이블 (사냥터 마스터)
export interface HuntingGround {
  level: number;
  name: string;
  gold_reward: number;
  required_keys: number;
}

// hunting_logs 테이블 (사냥 로그)
export interface HuntingLog {
  id: string;
  user_id: string;
  hunting_level: number;
  reward_type: string;
  reward_amount: number;
  created_at: string;
}

// Database 타입 (Supabase 클라이언트용)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      weapon_descriptions: {
        Row: WeaponDescription;
        Insert: Omit<WeaponDescription, "id" | "created_at">;
        Update: Partial<Omit<WeaponDescription, "id" | "created_at">>;
      };
      titles: {
        Row: Title;
        Insert: Omit<Title, "id" | "created_at">;
        Update: Partial<Omit<Title, "id" | "created_at">>;
      };
      user_titles: {
        Row: UserTitle;
        Insert: Omit<UserTitle, "id" | "acquired_at" | "title">;
        Update: Partial<Omit<UserTitle, "id" | "user_id" | "title_id" | "acquired_at" | "title">>;
      };
      upgrade_logs: {
        Row: UpgradeLog;
        Insert: Omit<UpgradeLog, "id" | "created_at">;
        Update: never;
      };
      battle_logs: {
        Row: BattleLog;
        Insert: Omit<BattleLog, "id" | "created_at">;
        Update: never;
      };
      checkin_logs: {
        Row: CheckinLog;
        Insert: Omit<CheckinLog, "id" | "checked_in_at">;
        Update: never;
      };
    };
  };
}
