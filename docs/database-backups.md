# Encrypted database backups (DIY)

Supabase Free has no automatic daily backups. This repo uses a GitHub Actions
workflow (`.github/workflows/db-backup.yml`) to dump Postgres, encrypt the dump,
and store it as a workflow artifact **off Supabase**.

## What is backed up

- **Included:** Postgres data (`pg_dump -Fc`) — products, orders, purchases,
  reviews, profiles, wishlist, cart, newsletter, site settings, etc.
  Customer PII (emails, order rows) is in the dump and is **encrypted** before upload.
- **Not included:** Supabase **Storage** objects (pattern PDFs in the `patterns`
  bucket, product images). DB backups only restore Storage *metadata* if any;
  files must be recovered separately if ever deleted.

## Schedule

- Daily at **04:00 UTC**
- Manual: **Actions → Database backup → Run workflow**

## Secrets (GitHub → Settings → Secrets and variables → Actions)

| Name | Value |
| --- | --- |
| `SUPABASE_DB_URL` | Direct Postgres URI (see below) |
| `BACKUP_GPG_PASSPHRASE` | Strong passphrase you also store offline |

### Where to get `SUPABASE_DB_URL`

1. [Supabase Dashboard](https://supabase.com/dashboard) → project **notioncreativeart_nextjs**
2. **Project Settings → Database**
3. Under **Connection string**, choose **URI**
4. Prefer **Direct connection** (`db.<project-ref>.supabase.co:5432`), not the
   transaction pooler (`:6543`), for `pg_dump`
5. Replace `[YOUR-PASSWORD]` with the database password (reset under Database
   settings if needed)
6. Paste the full URI into the GitHub secret `SUPABASE_DB_URL`

Example shape (do not commit real credentials):

```text
postgresql://postgres.[ref]:YOUR_PASSWORD@db.[ref].supabase.co:5432/postgres
```

### `BACKUP_GPG_PASSPHRASE`

Generate a long random passphrase (password manager). Store it **outside**
GitHub as well — if you lose it, encrypted artifacts cannot be restored.

## Retention and storage quota

- Artifact retention: **14 days** (workflow `retention-days: 14`).
- GitHub Free shares **~500 MB** of Actions artifact / Packages storage across
  the whole account. Dumps for this project are typically on the order of a few
  MB compressed+encrypted; **14 daily artifacts are unlikely to approach 500 MB**
  at current size. Revisit if the DB grows a lot or many other repos upload large
  artifacts.

## Restore procedure

### 1. Download the artifact

1. GitHub → **Actions** → **Database backup** → open a successful run
2. Download **`db-backup`** (or the named artifact for that run)
3. Extract to get `nca-db-YYYYMMDD-HHMMSS.dump.gpg`

### 2. Decrypt

```bash
gpg --batch --yes --passphrase "YOUR_PASSPHRASE" \
  --decrypt --output nca-db.dump \
  nca-db-YYYYMMDD-HHMMSS.dump.gpg
```

Prefer prompting / a passphrase file over putting the passphrase in shell history:

```bash
gpg --decrypt --output nca-db.dump nca-db-YYYYMMDD-HHMMSS.dump.gpg
```

### 3. Restore into Postgres

Restore into an **empty** database or a dedicated recovery project — never
blindly overwrite production without a plan.

```bash
# Example: restore into a local or new Supabase DB
pg_restore --clean --if-exists --no-owner --no-acl \
  -d "postgresql://USER:PASSWORD@HOST:5432/postgres" \
  nca-db.dump
```

Notes:

- Custom format (`-Fc`) requires `pg_restore`, not `psql < file.sql`.
- `--no-owner --no-acl` avoids role mismatches between environments.
- After restore, reset passwords for any custom DB roles if needed; verify app
  env vars and Storage files separately.

### 4. Secure cleanup

Delete decrypted `nca-db.dump` from disk when finished. Never commit dumps
(encrypted or not) to git.

## Connection gotcha (IPv6)

GitHub-hosted runners sometimes cannot reach Supabase **direct** hosts that are
IPv6-only. If the workflow fails with a connection timeout:

1. Try the **Session mode** pooler connection string from the same Database
   settings page (still put it in `SUPABASE_DB_URL`), or
2. Enable Supabase’s IPv4 add-on / use a runner that has IPv6, or
3. Use a self-hosted runner with working egress to the DB.

## Failure behavior

If `pg_dump`, encryption, or artifact upload fails, the workflow **fails** so
the run shows red in Actions. Watch the first manual run and optionally enable
GitHub email/notifications for failed workflows.
