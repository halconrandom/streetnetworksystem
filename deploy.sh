#!/usr/bin/env bash
set -euo pipefail

# Backward-compatible wrapper.
# Canonical script location:
#   scripts/deploy.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "$SCRIPT_DIR/scripts/deploy.sh" "$@"
