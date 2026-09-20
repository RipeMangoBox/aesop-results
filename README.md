# AESOP results preview

Standalone static snapshot of the Blender v3 results review. The site contains only encrypted media and an encrypted catalog. The invitation secret is not committed or uploaded.

AES-256-GCM, independent 96-bit nonces, PBKDF2-HMAC-SHA256 (600,000 iterations), randomly generated 160-bit invitation. Decryption uses browser Web Crypto on HTTPS. No remote API, analytics, campus server, or invitation transmission. The key remains in page memory; reload or Lock requires re-entry.

This is encrypted content delivery, not server-side accounts or DRM. The public repository exposes ciphertext and the site shell. Recipients can share the invitation or save decrypted videos. Changing the invitation cannot revoke old snapshots already downloaded. Do not put invitation codes in URLs, commits, or public issues.

Only `site/` is deployed by GitHub Pages. Build locally with `node build.mjs /path/to/user_study` in a fresh checkout before publishing. Local `runtime/` is excluded from Git. Existing content is a one-time snapshot; source changes require an explicit new build and upload.
