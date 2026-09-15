# 0003: Single-curator password auth without a provider

The Curator is a single human. We deliberately skip third-party auth (OAuth providers, a managed identity service) and use a single environment-secret password. A successful login mints a stateless encrypted cookie (jose, A256GCM, HttpOnly, SameSite=Lax). There is no session store; revoking all sessions means rotating the session secret.

The login endpoint is rate-limited (10 failures → 15-minute lockout per IP, tracked in D1) and write APIs additionally check the request Origin — cheap hardening that a solo deployment still deserves.