.PHONY: setup test verify reproduce-baseline reproduce-paper-visualisation reproduce-extensions figures

setup:
	uv sync --directory python --frozen
	npm ci

test:
	cd python && uv run pytest
	npm test

verify:
	cd python && uv run python ../tools/verify_reported_results.py

reproduce-baseline:
	cd python && uv run python -m src.run_experiments --config configs/paper_revision.yaml

reproduce-paper-visualisation:
	npm run reproduce:paper-visualisation

reproduce-extensions:
	npm run reproduce:extensions

figures:
	npm run figures:localisation
	npm run figures:paper-visualisation
	npm run figures:extensions
