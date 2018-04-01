---
layout: post
title: "Let's Encrypt Wildcard Certificates with Certbot"
categories: linux multimeter
---
This post shall describe how to obtain a free wildcard cert for your domain from Let's Encrypt with the recommended `certbot` python based utility. Of course there are few [other clients](https://letsencrypt.org/docs/client-options/#acme-v2-compatible-clients) that already support the ACME v2 protocol, which is required for wildcards, i will only show certbot command here, but the procedure with other clients should be pretty similar.

So let's get started. Certbot version 0.22.0 or higher is required. Look at the [instructions](https://certbot.eff.org/) and make sure it is properly installed on the server. Wildcard certificates can only be issued with the DNS challenge, so you must be able to add a TXT record to the domain, the typical `http-01` or `tls-sni-01` challenge will **not** do it.

```bash
certbot certonly --manual -d "*.yourdomain.tld" --preferred-challenges dns-01 --server https://acme-v02.api.letsencrypt.org/directory
```

TODO: parameter desc.

#### Sources
<https://certbot.eff.org/docs/using.html?highlight=wildcard#manual>
<https://community.letsencrypt.org/t/acme-v2-production-environment-wildcards/55578>
<https://github.com/certbot/certbot/issues/5369>
<https://github.com/certbot/certbot/issues/5719>
