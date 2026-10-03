"""
Read-only diagnostic for the Pokeverse user table.

Prints enough to tell WHY a login fails without ever revealing a
password. Run it against the same database Render uses.

    python check_users.py

It reports, per account:
  - id, username, email (and whether the email has stray case/space)
  - the stored credential's FORMAT: bcrypt hash vs legacy plaintext
  - its length, and a masked preview (first and last character only)

Nothing is written. Safe to run on production.
"""
import os
import sys

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    sys.exit(
        "DATABASE_URL is not set.\n\n"
        "Get it from Render: your Postgres service -> Connect ->\n"
        "'External Database URL'. Then run, in PowerShell:\n\n"
        '  $env:DATABASE_URL="postgresql://...paste it here..."\n'
        "  python check_users.py\n"
    )

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def mask(value: str) -> str:
    """Show only the first and last character, so we can spot stray
    whitespace or quotes without exposing the secret."""
    if not value:
        return "<empty>"
    if len(value) <= 2:
        return "*" * len(value)
    return f"{value[0]}{'*' * (len(value) - 2)}{value[-1]}"

with engine.connect() as conn:
    rows = conn.execute(
        text("SELECT id, username, email, hashed_password FROM users ORDER BY id")
    ).fetchall()

    print(f"\n{len(rows)} account(s) found.\n")
    print(f"{'ID':<4} {'USERNAME':<16} {'EMAIL':<32} {'FORMAT':<10} {'LEN':<5} PREVIEW")
    print("-" * 95)

    for row in rows:
        uid, username, email, stored = row
        stored = stored or ""

        # bcrypt hashes always begin with $2a$, $2b$ or $2y$.
        fmt = "bcrypt" if stored.startswith("$2") else "PLAINTEXT"

        flags = []
        if email != email.strip():
            flags.append("email has surrounding whitespace")
        if email != email.lower():
            flags.append("email has uppercase")
        if stored != stored.strip():
            flags.append("password has surrounding whitespace")

        print(f"{uid:<4} {username:<16} {email:<32} {fmt:<10} {len(stored):<5} {mask(stored)}")
        for f in flags:
            print(f"     ^ NOTE: {f}")

    # Duplicate emails that differ only by case would make the
    # case-insensitive lookup pick an arbitrary one of them.
    seen = {}
    for row in rows:
        key = (row[2] or "").strip().lower()
        seen.setdefault(key, []).append(row[0])
    dupes = {k: v for k, v in seen.items() if len(v) > 1}
    if dupes:
        print("\nWARNING - emails that collide case-insensitively:")
        for k, ids in dupes.items():
            print(f"  {k}: account ids {ids}")
        print("  The login lookup will pick one of these, possibly not the")
        print("  one whose password you are typing.")

    print()