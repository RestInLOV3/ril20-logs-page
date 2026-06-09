import { handle } from 'hono/cloudflare-pages';
import app from '../../src/lib/hono-api';

export const onRequest = handle(app);
