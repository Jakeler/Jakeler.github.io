// Mints per-visitor email aliases like blog-x7f2@jklr.org so incoming mail
// reveals when/where the address was obtained. The local part is a keyed
// hash of ip+date: the same visitor gets the same alias all day, so repeat
// clicks create no new KV entries.

const DOMAIN = 'jklr.org'
const PREFIX = 'blog'
const HASH_LEN = 4
const SITE = 'https://blog.jklr.org'

const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567'

async function mintAlias(env, ip) {
  const date = new Date().toISOString().slice(0, 10)
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.HMAC_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign(
    'HMAC', key, new TextEncoder().encode(`${ip}|${date}`)))

  let local = PREFIX + '-'
  for (let i = 0; i < HASH_LEN; i++)
    local += BASE32[mac[i] % 32] // uniform: 256 is a multiple of 32
  return `${local}@${DOMAIN}`
}

async function recordFirstSeen(env, alias, request, ip) {
  if (await env.MAIL_KV.get(alias) !== null)
    return // deterministic repeat (or a collision): keep the first record
  await env.MAIL_KV.put(alias, JSON.stringify({
    created: new Date().toISOString(),
    ip,
    country: request.cf?.country,
    ua: request.headers.get('User-Agent'),
    referer: request.headers.get('Referer'),
  }))
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname
    if (path !== '/api/mail' && path !== '/api/contact')
      return new Response('Not found', { status: 404 })

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const alias = await mintAlias(env, ip)
    await recordFirstSeen(env, alias, request, ip)

    if (path === '/api/contact') // no-JS fallback
      return Response.redirect(`mailto:${alias}`, 302)
    return Response.json({ email: alias }, {
      headers: { 'Access-Control-Allow-Origin': SITE },
    })
  },
}
