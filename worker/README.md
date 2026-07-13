# blog-mail worker

Mints tracking email aliases (`blog-xxxx@jklr.org`) for the contact link,
see `src/index.js`. Runs on mail-blog.jklr.org (custom domain, DNS record is
created automatically; must stay single-level, Universal SSL wildcards
don't cover deeper subdomains). Deploy:

```sh
wrangler kv namespace create MAIL_KV   # put the returned id into wrangler.toml
wrangler secret put HMAC_SECRET        # any long random string, e.g. `openssl rand -hex 32`
wrangler deploy
```

Look up where an alias came from:

```sh
# --remote is required: without it wrangler queries a local dev store
wrangler kv key get --remote --binding MAIL_KV blog-xxxx@jklr.org
wrangler kv key list --remote --binding MAIL_KV
```

Receiving requires a catch-all (or `blog-*`) forwarding rule on jklr.org
at the mail provider.
