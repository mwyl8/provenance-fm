.PHONY: install backend frontend dev test clean ingest watchdog

VENV ?= .venv
PY   := $(VENV)/bin/python
PIP  := $(VENV)/bin/pip

install:
	python3 -m venv $(VENV)
	$(PIP) install -r backend/requirements.txt
	cd frontend && npm install

backend:
	$(VENV)/bin/uvicorn backend.provenance.app:app --reload --host 127.0.0.1 --port 5050

frontend:
	cd frontend && npm run dev

test:
	$(PY) backend/tests/test_matching.py

ingest:
	@echo "usage: $(PY) -m backend.scripts.ingest_corpus <path> --source <tag> [--run-mert]"

watchdog:
	@echo "usage: $(PY) -m backend.scripts.run_watchdog <urls_file> --source <tag> [--run-mert]"

clean:
	rm -rf $(VENV) frontend/node_modules frontend/dist backend/data
