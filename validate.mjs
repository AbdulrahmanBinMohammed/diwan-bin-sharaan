export function validatePoems(data) {
  if (!Array.isArray(data) || !data.length) throw Error('بيانات القصائد فارغة');
  const ids = new Set();
  for (const p of data) {
    if (!/^[a-zA-Z0-9-]+$/.test(p.id) || ids.has(p.id)) throw Error('معرّف غير صالح أو مكرر: ' + p.id);
    ids.add(p.id);
    if (typeof p.title !== 'string' || !p.title.trim() || typeof p.status !== 'string' || !p.source) throw Error('سجل غير مكتمل: ' + p.id);
    if (!Array.isArray(p.verses) || !p.verses.length || p.verses.some(v => !Array.isArray(v) || v.length !== 2 || v.some(s => typeof s !== 'string' || !s.trim()))) throw Error('بيت ناقص في ' + p.id);
    if (p.text !== p.verses.map(v => v.join(' | ')).join('\n')) throw Error('النص لا يطابق الأبيات: ' + p.id);
    if (!Array.isArray(p.issues) || !Array.isArray(p.keywords)) throw Error('حقول المراجعة أو الكلمات المفتاحية غير صالحة: ' + p.id);
    if (p.source.type === 'x') {
      const url = new URL(p.source.url);
      if (url.protocol !== 'https:' || url.hostname !== 'x.com' || !/^\d+$/.test(p.source.postId) || !url.pathname.endsWith('/status/' + p.source.postId)) throw Error('مصدر X غير صالح: ' + p.id);
    } else if (p.source.type !== 'user' && (!Number.isInteger(p.source.region) || p.source.region < 1 || !Number.isInteger(p.source.page))) throw Error('مصدر PDF غير صالح: ' + p.id);
  }
}
