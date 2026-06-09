-- Migration: 0002_scenario_filters
-- scenarios 테이블에 룰 시스템 및 시나리오 유형 컬럼 추가

ALTER TABLE scenarios ADD COLUMN rule TEXT;
ALTER TABLE scenarios ADD COLUMN scenario_type TEXT;
