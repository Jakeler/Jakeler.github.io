# blog-mail worker

Mints tracking email aliases (`blog-xxxx@jklr.org`) for the contact link,
see `src/index.js`. Deploy:

```sh
wrangler kv namespace create MAIL_KV   # put the returned id into wrangler.toml
wrangler secret put HMAC_SECRET        # any long random string, e.g. `openssl rand -hex 32`
wrangler deploy
```

Look up where an alias came from:

```sh
wrangler kv key get --binding MAIL_KV blog-xxxx@jklr.org
```

Receiving requires a catch-all (or `blog-*`) forwarding rule on jklr.org
at the mail provider.
