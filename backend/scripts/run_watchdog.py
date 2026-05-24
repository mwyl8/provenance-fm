"""Watchdog scraper loop — pull AI platform outputs into the corpus.

Reads a file of URLs (one per line) and ingests them into the corpus
with the configured source tag. v1 is fire-once; v2 will schedule via
cron and continuously pull.

Usage:
    python -m backend.scripts.run_watchdog suno_urls.txt --source suno
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

_HERE = Path(__file__).resolve()
sys.path.insert(0, str(_HERE.parent.parent.parent))

from backend.provenance.config import ensure_dirs
from backend.provenance.scraper import scrape_one

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("watchdog")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("urls_file", type=str, help="text file with one URL per line")
    ap.add_argument("--source", type=str, default="suno")
    ap.add_argument("--run-mert", action="store_true")
    args = ap.parse_args()
    ensure_dirs()

    urls = [u.strip() for u in Path(args.urls_file).read_text().splitlines() if u.strip()]
    log.info("scraping %d URLs as source=%s", len(urls), args.source)
    n = 0
    for u in urls:
        item = scrape_one(u, args.source, run_mert=args.run_mert)
        if item:
            log.info("ok: %s", item.title or item.id)
            n += 1
        else:
            log.warning("failed: %s", u)
    log.info("done: %d/%d ingested", n, len(urls))


if __name__ == "__main__":
    main()
