.PHONY: install backend frontend dev test clean ingest watchdog doctor

# Override with: make install PYTHON=python3.12
PYTHON ?= python3.12
VENV   ?= .venv
PY     := $(VENV)/bin/python
PIP    := $(VENV)/bin/pip

doctor:
	@echo "Looking for compatible Python interpreters..."
	@for v in python3.12 python3.11 python3.10; do \
	  if command -v $$v >/dev/null 2>&1; then \
	    echo "  ok   $$v -> $$($$v --version)"; \
	  else \
	    echo "  miss $$v (install via 'brew install $$(echo $$v | sed s/python/python@/)' or uv)"; \
	  fi; \
	done
	@echo ""
	@echo "Default python3 is $$(python3 --version 2>&1). torch/numpy don't ship wheels for 3.13+ yet."
	@echo "Run with: make install PYTHON=python3.12"

install:
	@command -v $(PYTHON) >/dev/null 2>&1 || (echo "ERROR: $(PYTHON) not found — run 'make doctor' for help"; exit 1)
	$(PYTHON) -m venv $(VENV)
	$(PIP) install --upgrade pip
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
