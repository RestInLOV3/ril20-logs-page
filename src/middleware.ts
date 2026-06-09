import { defineMiddleware } from 'astro:middleware';
// @ts-ignore
import { env } from 'cloudflare:workers';
import type { Env } from './lib/types';
import app from './lib/api';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/logs/api/')) {
    return app.fetch(context.request, env as Env);
  }
  return next();
});
