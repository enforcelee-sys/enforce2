-- ============================================
-- 사냥터 시스템 DB 스키마
-- ============================================

-- 1. 사냥터 마스터 테이블
CREATE TABLE hunting_grounds (
  level INT PRIMARY KEY,
  name TEXT NOT NULL,
  gold_reward INT NOT NULL,
  required_keys INT DEFAULT 3
);

-- 사냥터 데이터 삽입
INSERT INTO hunting_grounds (level, name, gold_reward) VALUES
(1, '허름한 들판', 10),
(2, '잡초 무성한 공터', 2641),
(3, '버려진 농지', 5273),
(4, '떠돌이들이 모이는 길목', 7904),
(5, '폐허가 된 초소', 10536),
(6, '음산한 숲 입구', 13168),
(7, '어둠이 깃든 숲', 15799),
(8, '저주받은 삼림', 18431),
(9, '피비린내 나는 숲속', 21062),
(10, '그림자 숲의 심장', 23694),
(11, '무너진 광산', 26326),
(12, '광기의 채굴장', 28957),
(13, '붉게 물든 갱도', 31589),
(14, '금지된 심연 광산', 34220),
(15, '잊혀진 지하왕국', 36852),
(16, '검은 성채 외곽', 39484),
(17, '피로 물든 전쟁터', 42115),
(18, '멸망한 왕국의 중심', 44747),
(19, '그림자의 왕좌', 47378),
(20, '강화의 종착지 : 심연의 끝', 50000);

-- 2. 유저 사냥 진행 상태 (profiles에 컬럼 추가)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_hunting_level INT DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hunting_keys INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_hunting BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hunting_started_at TIMESTAMPTZ;

-- 3. 사냥 로그 테이블
CREATE TABLE hunting_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hunting_level INT NOT NULL,
  reward_type TEXT NOT NULL, -- 'GOLD', 'KEY', 'PROTECTION_LOW', 'PROTECTION_MID', 'PROTECTION_HIGH'
  reward_amount INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_hunting_logs_user_created ON hunting_logs(user_id, created_at DESC);

-- RLS 설정
ALTER TABLE hunting_grounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunting_logs ENABLE ROW LEVEL SECURITY;

-- hunting_grounds는 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read hunting_grounds"
  ON hunting_grounds FOR SELECT USING (true);

-- hunting_logs는 자신의 로그만 조회 가능
CREATE POLICY "Users can view own hunting logs"
  ON hunting_logs FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own hunting logs"
  ON hunting_logs FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
