---
layout: post
title: "Let's Encrypt Wildcard Certificates with Certbot manual mode"
categories: certbot tls wildcard
tags: web tls dns
---
This post shall describe how to obtain a free wildcard TLS cert for your domain from Let's Encrypt with the recommended `certbot` python based utility. Of course there are few [other clients](https://letsencrypt.org/docs/client-options/#acme-v2-compatible-clients) that already support the ACME v2 protocol, which is required for wildcards, i will only show certbot command here, but the procedure with other clients should be pretty similar.

So let's get started. Certbot version 0.22.0 or higher is required. Look at the [instructions](https://certbot.eff.org/) and make sure it is properly installed on the server. Wildcard certificates can only be issued with the DNS challenge, so you must be able to add a TXT record to the domain, the typical `http-01`(port 80) or `tls-sni-01`(port 443) challenge will **not** do it.

There are plugins for some DNS providers available that automate the adding of the TXT record. For example Cloudflare, Google Cloud DNS, AWS Route 53, and more are supported so far, look [here](https://certbot.eff.org/docs/using.html#dns-plugins). I use Namecheap though, which unfortunately provides API access only to bigger customers... so i use the manual method (this works with all DNS providers):
```bash
certbot certonly --manual -d "*.yourdomain.tld" --preferred-challenges dns-01 --server https://acme-v02.api.letsencrypt.org/directory
```
The `certonly` command obtains a new certificate (without installing), `--manual` for the not automated manual mode, `-d` specifies the domain names, as mentioned above we must use the DNS challenge, this is done with `--preferred-challenges`. Per default the old ACME v1 api is used (which does not support wildcards), we have to explicitly use the staging api with `--server`.

Now go through the the interactive prompt, it should look like below. Note that you have to accept that your IP will be logged (or abort). Then just log into your DNS admin interface, add the TXT value and you get the wildcard certificate!
```
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Plugins selected: Authenticator manual, Installer None
Enter email address (used for urgent renewal and security notices) (Enter 'c' to
cancel): you@yourdomain.tld

-------------------------------------------------------------------------------
Please read the Terms of Service at
https://letsencrypt.org/documents/LE-SA-v1.2-November-15-2017.pdf. You must
agree in order to register with the ACME server at
https://acme-v02.api.letsencrypt.org/directory
-------------------------------------------------------------------------------
(A)gree/(C)ancel: a

-------------------------------------------------------------------------------
Would you be willing to share your email address with the Electronic Frontier
Foundation, a founding partner of the Let's Encrypt project and the non-profit
organization that develops Certbot? We'd like to send you email about EFF and
our work to encrypt the web, protect its users and defend digital rights.
-------------------------------------------------------------------------------
(Y)es/(N)o: n
Obtaining a new certificate
Performing the following challenges:
dns-01 challenge for ja-ke.tech

-------------------------------------------------------------------------------
NOTE: The IP of this machine will be publicly logged as having requested this
certificate. If you're running certbot in manual mode on a machine that is not
your server, please ensure you're okay with that.

Are you OK with your IP being logged?
-------------------------------------------------------------------------------
(Y)es/(N)o: y

-------------------------------------------------------------------------------
Please deploy a DNS TXT record under the name
_acme-challenge.ja-ke.tech with the following value:

xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Before continuing, verify the record is deployed.
-------------------------------------------------------------------------------
Press Enter to Continue
Waiting for verification...
Cleaning up challenges

IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/ja-ke.tech/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/ja-ke.tech/privkey.pem
   Your cert will expire on 2018-06-30. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le
```


#### Sources + additional info
<https://certbot.eff.org/docs/using.html?highlight=wildcard#manual>
<https://community.letsencrypt.org/t/acme-v2-production-environment-wildcards/55578>
<https://github.com/certbot/certbot/issues/5369>
<https://github.com/certbot/certbot/issues/5719>
