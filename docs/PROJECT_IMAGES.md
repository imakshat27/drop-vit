# Project images

Projects can have up to four screenshots. The first is the cover in discovery and the main image on the project page. The submission form supports reorder, removal and preview. Project pages show a thumbnail strip and an accessible native-dialog lightbox with arrow controls, keyboard navigation, Escape, focus restoration and touch swipe. Without media, the project identity is a compact fallback.

## Upload and storage

- Input: JPG, PNG or WebP, at most 10 MB per original file.
- Browser Canvas resizes to at most 1600 pixels on either side and encodes WebP at up to 500 KiB. It reduces quality/dimensions further when necessary. Canvas re-encoding removes original metadata; animated inputs become a still image.
- Authenticated, same-origin `/api/media/upload` requests issue exact-key, ten-minute S3 POST policies. Storage enforces WebP content type and the file-size limit. Upload initiation is limited to sixteen attempts per account per fifteen minutes.
- The browser sends image bytes directly to the private Neon `drop-project-images` bucket. No image processing happens on Cloudflare. Bucket CORS allows production and localhost ports 3000/3100.
- Objects first land under `staging/`. Submission creates a separate `images/` copy and validates its length, type and WebP dimensions. Upload tickets cannot modify the submitted copy. Only the uploader can attach a managed image to their project.
- PostgreSQL stores at most four media references in the existing project details JSON. No database migration or authentication change is required. Existing external screenshot URLs remain compatible.
- `/api/media/:id` serves submitted media publicly only when referenced by an approved project whose first weekly Drop has released. Other media requires its owner's session, or a curator session for a submitted project. Private responses use no-store. Released responses are eligible for the Cloudflare edge cache; cache hits skip the Next runtime, database and storage fetch.

AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3 and AWS_REGION are server-only environment variables. Pull them with `neon env pull --service object-storage --file .env.local`. Configure the same names as Worker secrets. Do not put credentials in public variables or Git. `neon.ts` declares the private bucket without changing other backend services.

## Cleanup

Removing an unsubmitted upload attempts to delete its objects. Images still referenced by any project cannot be deleted through the upload UI. Replaced and abandoned images can remain unreferenced after leaving a form or resubmitting.

Run `npm run media:cleanup` for a dry run; add `-- --apply` to delete unreferenced objects older than 24 hours. References from all project statuses are preserved. This cleanup is an operator command, not a scheduled job. Neon currently stores lifecycle configuration but does not enforce expiry rules, so bucket lifecycle rules are not used as a substitute.

## Verification

Unit tests cover the four-image limit, unsafe references, duplicate references, WebP headers/dimensions, POST policy constraints, ownership and public/private edge caching. Browser checks cover compression, file-type rejection, four slots, reordering/removal, gallery keys, focus restoration, mobile fit and endpoint access. Real Neon upload/copy/validation/delete checks are performed separately so CI does not require storage credentials.
