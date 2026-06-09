export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;
  ADMIN_TOKEN: string;
  R2_PUBLIC_URL: string;
}

export interface Scenario {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  color: string;
  cover_r2: string | null;
  created_at: string;
}

export interface Character {
  id: number;
  scenario_id: number;
  name: string;
  pl_name: string;
  image_r2: string | null;
  bio: string | null;
  sort_order: number;
}

export interface CharacterQuote {
  id: number;
  character_id: number;
  quote: string;
}

export interface Log {
  id: number;
  scenario_id: number;
  title: string;
  order_num: number;
  html_r2: string;
  created_at: string;
}

export interface Review {
  id: number;
  scenario_id: number;
  pl_name: string | null;
  content: string;
  created_at: string;
}
