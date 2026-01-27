-- ============================================
-- 강화하기 게임 - 최종 DB 스키마
-- 버전: 1.0
-- ============================================

-- 1. ENUM 타입 생성
CREATE TYPE upgrade_result AS ENUM ('SUCCESS', 'MAINTAIN', 'DESTROY');
CREATE TYPE action_type AS ENUM ('UPGRADE', 'SELL');
CREATE TYPE battle_result AS ENUM ('WIN', 'LOSE');

-- ============================================
-- 2. weapon_descriptions 테이블 (무기 이름/설명 마스터)
-- CSV 데이터를 저장하는 읽기 전용 테이블
-- ============================================
CREATE TABLE weapon_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weapon_type TEXT NOT NULL,        -- 칼, 활, 지팡이, 방패, 몽둥이
  concept TEXT NOT NULL,            -- 그림자, 피, 저주 등 50종
  level INT NOT NULL,               -- 0~20
  name TEXT NOT NULL,               -- "+5강 그림자 숨 쉬는 칼"
  description TEXT,                 -- 무기 설명
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(weapon_type, concept, level)
);

-- ============================================
-- 3. profiles 테이블 (유저 상태 통합)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,

  -- 무기 상태 (유저당 1개)
  weapon_type TEXT NOT NULL DEFAULT '칼',
  weapon_concept TEXT NOT NULL DEFAULT '그림자',
  weapon_level INT NOT NULL DEFAULT 0,

  -- 재화
  gold BIGINT NOT NULL DEFAULT 10000,

  -- 출석 시스템 (4시간 주기)
  last_checkin_at TIMESTAMPTZ,
  today_checkin_count INT DEFAULT 0,
  today_checkin_gold BIGINT DEFAULT 0,
  today_date DATE DEFAULT CURRENT_DATE,

  -- 배틀 시스템
  battle_ticket INT DEFAULT 10,
  last_ticket_regen_at TIMESTAMPTZ DEFAULT NOW(),
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,

  -- 파괴 방지권
  protection_low INT DEFAULT 0,     -- 10강 이하용
  protection_mid INT DEFAULT 0,     -- 15강 이하용
  protection_high INT DEFAULT 0,    -- 15강 이상용 (실패시 -1)

  -- 상점 최초 구매 여부 (초기 버전: 최초 1회 무료 지급)
  purchased_gold_small BOOLEAN DEFAULT FALSE,
  purchased_gold_medium BOOLEAN DEFAULT FALSE,
  purchased_gold_large BOOLEAN DEFAULT FALSE,
  purchased_prot_low BOOLEAN DEFAULT FALSE,
  purchased_prot_mid BOOLEAN DEFAULT FALSE,
  purchased_prot_high BOOLEAN DEFAULT FALSE,

  -- 결제 관련
  total_spent_krw INT DEFAULT 0,            -- 누적 결제액 (원화)
  first_purchase_done BOOLEAN DEFAULT FALSE, -- 첫 결제 여부

  -- 칭호 슬롯 (기본 2개, 최대 7개)
  title_slots INT DEFAULT 2,
  purchased_title_slots INT DEFAULT 0,       -- 구매한 슬롯 수 (최대 5)

  -- 강화 통계 (칭호 조건 체크용)
  total_upgrades INT DEFAULT 0,
  total_successes INT DEFAULT 0,
  total_maintains INT DEFAULT 0,
  total_destroys INT DEFAULT 0,
  current_success_streak INT DEFAULT 0,      -- 현재 연속 성공
  max_success_streak INT DEFAULT 0,          -- 최대 연속 성공
  used_only_cash_items BOOLEAN DEFAULT TRUE, -- 캐시템만 사용 여부
  used_only_gold BOOLEAN DEFAULT TRUE,       -- 골드만 사용 여부

  -- 무기별 최고 강화 기록 (칭호용)
  best_sword_level INT DEFAULT 0,            -- 칼
  best_bow_level INT DEFAULT 0,              -- 활
  best_staff_level INT DEFAULT 0,            -- 지팡이
  best_shield_level INT DEFAULT 0,           -- 방패
  best_club_level INT DEFAULT 0,             -- 몽둥이

  -- 무기별 파괴 횟수 (특수 칭호용)
  sword_destroy_count INT DEFAULT 0,
  bow_destroy_count INT DEFAULT 0,
  staff_destroy_count INT DEFAULT 0,
  shield_destroy_count INT DEFAULT 0,
  club_destroy_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. titles 테이블 (칭호 마스터)
-- ============================================
CREATE TABLE titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,                    -- 무기별, 'special', 'all_clear', 'payment'
  condition_type TEXT NOT NULL,     -- 'weapon_level', 'destroy_count', 'success_streak', 'all_weapons', 'payment', 'play_style'
  condition_weapon TEXT,            -- 특정 무기 조건일 때
  condition_value INT,              -- 조건 수치
  reward_gold BIGINT DEFAULT 0,     -- 칭호 획득시 골드 보상
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. user_titles 테이블 (유저 보유 칭호)
-- ============================================
CREATE TABLE user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT FALSE,
  equipped_slot INT,                -- 장착 슬롯 번호 (1~7)
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);

-- ============================================
-- 6. upgrade_logs 테이블 (강화/판매 기록)
-- ============================================
CREATE TABLE upgrade_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action action_type NOT NULL,       -- UPGRADE 또는 SELL
  weapon_type TEXT NOT NULL,
  weapon_concept TEXT NOT NULL,
  weapon_name TEXT,                  -- 무기 전체 이름
  from_level INT NOT NULL,
  to_level INT,                      -- 파괴시 0, 판매시 null
  result upgrade_result,             -- 강화시만 사용
  gold_change BIGINT NOT NULL,       -- 음수=소비, 양수=획득
  used_protection TEXT,              -- 사용한 파괴방지권 등급 (low/mid/high)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. battle_logs 테이블 (배틀 기록)
-- ============================================
CREATE TABLE battle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 내 무기 정보
  my_weapon_type TEXT NOT NULL,
  my_weapon_concept TEXT NOT NULL,
  my_weapon_level INT NOT NULL,
  my_weapon_name TEXT,

  -- 상대 무기 정보
  opponent_weapon_type TEXT NOT NULL,
  opponent_weapon_concept TEXT NOT NULL,
  opponent_weapon_level INT NOT NULL,
  opponent_weapon_name TEXT,

  -- 결과
  win_rate INT NOT NULL,              -- 최종 승률 (5~95)
  matchup_bonus INT NOT NULL,         -- 상성 보정 (-12, 0, +12)
  result battle_result NOT NULL,
  gold_earned BIGINT NOT NULL DEFAULT 0,
  battle_message TEXT,                -- 결과 문구

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. checkin_logs 테이블 (출석 기록)
-- ============================================
CREATE TABLE checkin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_gold BIGINT NOT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- weapon_descriptions RLS (읽기 공개)
ALTER TABLE weapon_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view weapon_descriptions"
  ON weapon_descriptions FOR SELECT
  TO authenticated
  USING (true);

-- profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- titles RLS (읽기 공개)
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view titles"
  ON titles FOR SELECT TO authenticated USING (true);

-- user_titles RLS
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own titles"
  ON user_titles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own titles"
  ON user_titles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own titles"
  ON user_titles FOR UPDATE USING (auth.uid() = user_id);

-- upgrade_logs RLS
ALTER TABLE upgrade_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own upgrade_logs"
  ON upgrade_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own upgrade_logs"
  ON upgrade_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- battle_logs RLS
ALTER TABLE battle_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own battle_logs"
  ON battle_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own battle_logs"
  ON battle_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- checkin_logs RLS
ALTER TABLE checkin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own checkin_logs"
  ON checkin_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkin_logs"
  ON checkin_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 초기 시드 데이터: 칭호
-- ============================================

-- 칼 칭호
INSERT INTO titles (name, description, category, condition_type, condition_weapon, condition_value, reward_gold) VALUES
  ('검을 쥔 자', '칼 +5 달성', '칼', 'weapon_level', '칼', 5, 10000),
  ('검객', '칼 +10 달성', '칼', 'weapon_level', '칼', 10, 50000),
  ('검술의 달인', '칼 +15 달성', '칼', 'weapon_level', '칼', 15, 200000),
  ('검성', '칼 +20 달성', '칼', 'weapon_level', '칼', 20, 1000000),
  ('부러진 검의 주인', '칼 파괴 5회', '칼', 'destroy_count', '칼', 5, 30000);

-- 활 칭호
INSERT INTO titles (name, description, category, condition_type, condition_weapon, condition_value, reward_gold) VALUES
  ('사냥꾼', '활 +5 달성', '활', 'weapon_level', '활', 5, 10000),
  ('명사수', '활 +10 달성', '활', 'weapon_level', '활', 10, 50000),
  ('백발백중', '활 +15 달성', '활', 'weapon_level', '활', 15, 200000),
  ('궁신', '활 +20 달성', '활', 'weapon_level', '활', 20, 1000000),
  ('흔들림 없는 손', '연속 성공 5회', '활', 'success_streak', NULL, 5, 30000);

-- 지팡이 칭호
INSERT INTO titles (name, description, category, condition_type, condition_weapon, condition_value, reward_gold) VALUES
  ('견습 마법사', '지팡이 +5 달성', '지팡이', 'weapon_level', '지팡이', 5, 10000),
  ('마도사', '지팡이 +10 달성', '지팡이', 'weapon_level', '지팡이', 10, 50000),
  ('대마도사', '지팡이 +15 달성', '지팡이', 'weapon_level', '지팡이', 15, 200000),
  ('아크메이지', '지팡이 +20 달성', '지팡이', 'weapon_level', '지팡이', 20, 1000000),
  ('확률조작 의심', '실패 없이 +10 달성', '지팡이', 'no_fail_streak', NULL, 10, 100000);

-- 방패 칭호
INSERT INTO titles (name, description, category, condition_type, condition_weapon, condition_value, reward_gold) VALUES
  ('파수꾼', '방패 +5 달성', '방패', 'weapon_level', '방패', 5, 10000),
  ('수호자', '방패 +10 달성', '방패', 'weapon_level', '방패', 10, 50000),
  ('철벽', '방패 +15 달성', '방패', 'weapon_level', '방패', 15, 200000),
  ('난공불락', '방패 +20 달성', '방패', 'weapon_level', '방패', 20, 1000000),
  ('끝없는 인내', '방패 파괴 10회', '방패', 'destroy_count', '방패', 10, 50000);

-- 몽둥이 칭호
INSERT INTO titles (name, description, category, condition_type, condition_weapon, condition_value, reward_gold) VALUES
  ('동네 깡패', '몽둥이 +5 달성', '몽둥이', 'weapon_level', '몽둥이', 5, 10000),
  ('난폭자', '몽둥이 +10 달성', '몽둥이', 'weapon_level', '몽둥이', 10, 50000),
  ('폭력의 화신', '몽둥이 +15 달성', '몽둥이', 'weapon_level', '몽둥이', 15, 200000),
  ('법이 두려운 자', '몽둥이 +20 달성', '몽둥이', 'weapon_level', '몽둥이', 20, 1000000),
  ('멍청하지만 끈질김', '몽둥이 파괴 10회', '몽둥이', 'destroy_count', '몽둥이', 10, 50000);

-- 올클리어 칭호
INSERT INTO titles (name, description, category, condition_type, condition_weapon, condition_value, reward_gold) VALUES
  ('만물박사', '5종 무기 모두 +5 달성', 'all_clear', 'all_weapons', NULL, 5, 100000),
  ('무기 마스터', '5종 무기 모두 +10 달성', 'all_clear', 'all_weapons', NULL, 10, 500000),
  ('전설의 대장장이', '5종 무기 모두 +15 달성', 'all_clear', 'all_weapons', NULL, 15, 2000000),
  ('신의 경지', '5종 무기 모두 +20 달성', 'all_clear', 'all_weapons', NULL, 20, 10000000);

-- 결제/플레이스타일 칭호
INSERT INTO titles (name, description, category, condition_type, condition_weapon, condition_value, reward_gold) VALUES
  ('지갑을 연 자', '첫 결제 완료', 'payment', 'first_purchase', NULL, 1, 50000),
  ('VIP I', '누적 5만원 결제', 'payment', 'total_spent', NULL, 50000, 500000),
  ('현질러', '캐시템만 사용하여 +10 달성', 'play_style', 'cash_only', NULL, 10, 100000),
  ('쌀먹러', '골드만 사용하여 +15 달성', 'play_style', 'gold_only', NULL, 15, 200000);

-- ============================================
-- 신규 유저 자동 설정 트리거
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_weapon_type TEXT;
  random_concept TEXT;
  weapon_types TEXT[] := ARRAY['칼', '활', '지팡이', '방패', '몽둥이'];
  concepts TEXT[];
BEGIN
  -- 랜덤 무기 타입 선택
  random_weapon_type := weapon_types[1 + floor(random() * 5)::int];

  -- 해당 무기 타입의 컨셉 목록 조회
  SELECT ARRAY_AGG(DISTINCT concept) INTO concepts
  FROM weapon_descriptions
  WHERE weapon_type = random_weapon_type;

  -- 컨셉이 없으면 기본값 사용
  IF concepts IS NULL OR array_length(concepts, 1) IS NULL THEN
    random_concept := '그림자';
  ELSE
    random_concept := concepts[1 + floor(random() * array_length(concepts, 1))::int];
  END IF;

  -- profiles 생성
  INSERT INTO profiles (
    id,
    nickname,
    weapon_type,
    weapon_concept,
    weapon_level,
    gold,
    battle_ticket,
    last_ticket_regen_at,
    title_slots
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    random_weapon_type,
    random_concept,
    0,
    10000,
    10,
    NOW(),
    2
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 등록
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 인덱스 (성능 최적화)
-- ============================================
CREATE INDEX idx_weapon_descriptions_lookup
  ON weapon_descriptions(weapon_type, concept, level);

CREATE INDEX idx_upgrade_logs_user_created
  ON upgrade_logs(user_id, created_at DESC);

CREATE INDEX idx_battle_logs_user_created
  ON battle_logs(user_id, created_at DESC);

CREATE INDEX idx_checkin_logs_user_created
  ON checkin_logs(user_id, checked_in_at DESC);

CREATE INDEX idx_user_titles_user
  ON user_titles(user_id);
