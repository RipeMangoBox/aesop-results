# AESOP results preview

Updateable static results review. The site contains only encrypted media and an encrypted catalog. The invitation secret is not committed or uploaded. One invitation supports repeated visits and successive publications, with no use-count or expiry limit implemented.

AES-256-GCM, independent 96-bit nonces, PBKDF2-HMAC-SHA256 (600,000 iterations), randomly generated 160-bit invitation. Decryption uses browser Web Crypto on HTTPS. No remote API, analytics, campus server, or invitation transmission. The key remains in page memory; reload or Lock requires re-entry.

This is encrypted content delivery, not server-side accounts or DRM. The public repository exposes ciphertext and the site shell. Recipients can share the invitation or save decrypted videos. Changing the invitation cannot revoke old snapshots already downloaded. Do not put invitation codes in URLs, commits, or public issues.

Only `site/` is deployed by GitHub Pages. Update repeatedly with `node publish.mjs /path/to/user_study`. The script reuses `runtime/invite.txt`; missing invitations cause an error rather than automatic rotation. Restore this private file when moving to another computer. `--init` is exclusively for an explicitly new site, not routine updates.

Each update publishes a versioned encrypted catalog and fresh ciphertext while preserving the website address and invitation. The active and previous version are retained; older generated releases are moved to a private local archive. Fetching the release configuration bypasses stale browser caches. Refresh to view newly published results. Updates are explicitly published, not automatic uploads whenever a local file changes. Viewing published results never requires campus-network access or the source computer to remain online.
