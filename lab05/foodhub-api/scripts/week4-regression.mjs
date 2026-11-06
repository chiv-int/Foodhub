// Run with the API started (npm run start:dev):  node scripts/week4-regression.mjs
const base = 'http://localhost:3000';
let failed = 0;

async function call(method, path, body, headers = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : undefined; } catch { json = undefined; }
  return { status: res.status, body: json, headers: res.headers };
}

function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${detail}`);
  if (!ok) failed++;
}

const list = await call('GET', '/v1/restaurants?limit=2');
check('GET /v1/restaurants?limit=2 -> 200, 2 items, total 3',
  list.status === 200 && list.body.data.length === 2 && list.body.total === 3, `(${list.status})`);

const o1 = await call('POST', '/v1/orders', { restaurantId: 1, items: ['amok'] });
check('POST /v1/orders (valid) -> 201 PLACED', o1.status === 201 && o1.body.status === 'PLACED', `(${o1.status})`);

const bad = await call('POST', '/v1/orders', { restaurantId: 'a', items: [] });
check('POST /v1/orders (restaurantId "a", items []) -> 400', bad.status === 400, `(${bad.status})`);

const nf = await call('POST', '/v1/orders', { restaurantId: 99, items: ['amok'] });
check('POST /v1/orders, restaurant 99 -> 404', nf.status === 404, `(${nf.status})`);

const got = await call('GET', `/v1/orders/${o1.body.id}`);
check('GET /v1/orders/{id} (exists) -> 200', got.status === 200 && got.body.id === o1.body.id, `(${got.status})`);

const gone = await call('GET', '/v1/orders/does-not-exist');
check('GET /v1/orders/{id} (missing) -> 404', gone.status === 404, `(${gone.status})`);

const cook = await call('PATCH', `/v1/orders/${o1.body.id}`, { status: 'COOKING' });
check('PATCH PLACED -> COOKING -> 200', cook.status === 200 && cook.body.status === 'COOKING', `(${cook.status})`);

const o2 = await call('POST', '/v1/orders', { restaurantId: 2, items: ['lok lak'] });
const skip = await call('PATCH', `/v1/orders/${o2.body.id}`, { status: 'DELIVERED' });
check('PATCH PLACED -> DELIVERED -> 409', skip.status === 409, `(${skip.status})`);

const badStatus = await call('PATCH', `/v1/orders/${o2.body.id}`, { status: 'FLYING' });
check('PATCH with an invalid status -> 400', badStatus.status === 400, `(${badStatus.status})`);

const key = { 'idempotency-key': 'abc-123' };
const k1 = await call('POST', '/v1/orders', { restaurantId: 1, items: ['amok'] }, key);
const k2 = await call('POST', '/v1/orders', { restaurantId: 1, items: ['amok'] }, key);
check('POST with Idempotency-Key abc-123: 1st -> 201, 2nd -> 200, same order',
  k1.status === 201 && k2.status === 200 && k1.body.id === k2.body.id, `(${k1.status} / ${k2.status})`);

const login = await fetch(`${base}/v1/login?username=dara`, { method: 'POST' });
const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0];
check('POST /v1/login sets the sid cookie', login.status === 201 && cookie.startsWith('sid='), `(${login.status})`);

const me = await call('GET', '/v1/me', undefined, { cookie });
check('GET /v1/me with the cookie -> 200 dara', me.status === 200 && me.body.username === 'dara', `(${me.status})`);

const anon = await call('GET', '/v1/me');
check('GET /v1/me without a cookie -> 401', anon.status === 401, `(${anon.status})`);

const cors = await call('GET', '/v1/restaurants', undefined, { origin: 'http://localhost:5173' });
check('CORS: allows http://localhost:5173 with credentials',
  cors.headers.get('access-control-allow-origin') === 'http://localhost:5173' &&
  cors.headers.get('access-control-allow-credentials') === 'true');

console.log(failed === 0 ? '\nAll checks passed' : `\n${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
