// cloudflare:workers에서 env를 가져오는 래퍼.
// @cloudflare/workers-types의 Cloudflare.Env 타입을 사용합니다.
// 주의: 이 import는 workerd 런타임에서만 작동합니다 (Pages Functions, wrangler dev).

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — cloudflare:workers 모듈의 타입이 workers-types에 완전히 노출되지 않음
import { env as _env } from 'cloudflare:workers';

export const bindings = _env as Cloudflare.Env;
