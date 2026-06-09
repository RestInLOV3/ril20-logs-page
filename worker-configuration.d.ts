// 이 파일은 wrangler.jsonc의 바인딩을 TypeScript에 노출합니다.
// `wrangler types` 명령으로 자동 생성 가능합니다.

/// <reference types="@cloudflare/workers-types" />

// Cloudflare namespace를 통한 Env 확장 (권장 방식)
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
    ASSETS: Fetcher;
    ADMIN_TOKEN: string;
    R2_PUBLIC_URL: string;
  }
}
