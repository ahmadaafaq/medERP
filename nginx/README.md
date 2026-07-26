# 🌐 Nginx Reverse Proxy Configuration

This directory contains Nginx reverse proxy configurations for MedERP.

---

## Capabilities
- Wildcard subdomain proxying (`*.mederp.app` → NestJS / Next.js).
- SSL termination via Let's Encrypt / Certbot.
- Request rate limiting and security header forwarding (`X-Tenant-Id`, `X-Forwarded-For`).
