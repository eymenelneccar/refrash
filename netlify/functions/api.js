exports.handler = async (event) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors };
  const secret = process.env.API_SECRET || '';
  if (secret) {
    const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
    if (auth !== `Bearer ${secret}`) return { statusCode: 401, headers: cors, body: JSON.stringify({ ok: false, error: 'unauthorized' }) };
  }
  const path = event.path || '';
  const bodyText = event.body || '';
  const owner = process.env.GITHUB_OWNER || '';
  const repo = process.env.GITHUB_REPO || '';
  const branch = process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN || '';
  const putFile = async (key, contentBase64) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${key}`;
    let sha = undefined;
    try {
      const cur = await fetch(`${url}?ref=${branch}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (cur.ok) { const j = await cur.json(); sha = j.sha; }
    } catch {}
    const resp = await fetch(url, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `update ${key}`, content: contentBase64, branch, sha }) });
    if (!resp.ok) { const t = await resp.text(); return { ok: false, error: t }; }
    return { ok: true };
  };
  const json = (obj) => ({ statusCode: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(obj) });
  const error = (code, msg) => ({ statusCode: code, headers: cors, body: JSON.stringify({ ok: false, error: msg }) });
  try {
    if (path.includes('/upload-image') && event.httpMethod === 'POST') {
      const p = JSON.parse(bodyText || '{}');
      const filename = String(p.filename || 'file');
      const data = String(p.data || '');
      const m = data.match(/^data:([^;]+);base64,(.*)$/);
      if (!m) return error(400, 'bad_data_url');
      const mime = m[1];
      const base64 = m[2];
      const isVideo = mime.startsWith('video/');
      const extMap = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/ogg': '.ogv' };
      const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
      const ext = extMap[mime] || (safeName.match(/\.[a-zA-Z0-9]+$/)?.[0] || '');
      const dir = isVideo ? 'assets/videos' : 'assets/images';
      const key = `${dir}/${Date.now()}-${safeName}${ext ? '' : ''}`;
      const r = await putFile(key, base64);
      if (!r.ok) return error(500, r.error || 'upload_failed');
      return json({ ok: true, path: `/${key}` });
    }
    if (path.includes('/save-hero') && event.httpMethod === 'POST') {
      const p = JSON.parse(bodyText || '{}');
      const str = JSON.stringify(p, null, 2);
      const content = Buffer.from(str).toString('base64');
      const key = 'assets/hero.json';
      const r = await putFile(key, content);
      if (!r.ok) return error(500, r.error || 'save_failed');
      return json({ ok: true, path: `/${key}` });
    }
    if (path.includes('/save-categories') && event.httpMethod === 'POST') {
      const p = JSON.parse(bodyText || '[]');
      const str = JSON.stringify(Array.isArray(p) ? p : [], null, 2);
      const content = Buffer.from(str).toString('base64');
      const key = 'assets/categories.json';
      const r = await putFile(key, content);
      if (!r.ok) return error(500, r.error || 'save_failed');
      return json({ ok: true, path: `/${key}` });
    }
    if (path.includes('/save-governorates') && event.httpMethod === 'POST') {
      const p = JSON.parse(bodyText || '[]');
      const str = JSON.stringify(Array.isArray(p) ? p : [], null, 2);
      const content = Buffer.from(str).toString('base64');
      const key = 'assets/governorates.json';
      const r = await putFile(key, content);
      if (!r.ok) return error(500, r.error || 'save_failed');
      return json({ ok: true, path: `/${key}` });
    }
    if (path.includes('/save-menu') && event.httpMethod === 'POST') {
      const p = JSON.parse(bodyText || '[]');
      const str = JSON.stringify(Array.isArray(p) ? p : [], null, 2);
      const content = Buffer.from(str).toString('base64');
      const key = 'assets/menu.json';
      const r = await putFile(key, content);
      if (!r.ok) return error(500, r.error || 'save_failed');
      return json({ ok: true, path: `/${key}` });
    }
    return error(404, 'not_found');
  } catch (e) {
    return error(500, String(e));
  }
}
