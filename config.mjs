import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const rawBase = (process.env.BASE_PATH || '').trim();
if (rawBase && !/^\/?[A-Za-z0-9._/-]+\/?$/.test(rawBase)) throw Error('BASE_PATH غير صالح');
if (rawBase.split('/').some(s => s === '.' || s === '..')) throw Error('BASE_PATH غير صالح');
export const basePath = rawBase.replace(/^\/+|\/+$/g, '') ? '/' + rawBase.replace(/^\/+|\/+$/g, '') : '';
const parsed = new URL(process.env.SITE_URL || 'http://127.0.0.1:8794');
if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) throw Error('SITE_URL يجب أن يكون أصل النطاق فقط');
export const origin = parsed.origin;
export const publicUrl = route => origin + basePath + '/' + route;
