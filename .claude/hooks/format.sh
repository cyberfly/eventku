#!/bin/bash

INPUT=$(cat)
FPATH=$(echo "$INPUT" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d.get('tool_input',{}).get('file_path',''))
")

[ -z "$FPATH" ] && exit 0
[ ! -f "$FPATH" ] && exit 0

EXT="${FPATH##*.}"

case "$EXT" in
  py)
    command -v black >/dev/null && black --quiet "$FPATH"
    command -v isort >/dev/null && isort --quiet "$FPATH"
    ;;
  js|jsx|ts|tsx)
    PROJECT_ROOT=$(git -C "$(dirname "$FPATH")" rev-parse --show-toplevel 2>/dev/null)
    [ -n "$PROJECT_ROOT" ] && cd "$PROJECT_ROOT" && npx --no-install prettier --write --log-level=warn "$FPATH"
    ;;
  go)
    command -v gofmt >/dev/null && gofmt -w "$FPATH"
    ;;
  rs)
    command -v rustfmt >/dev/null && rustfmt "$FPATH"
    ;;
esac

exit 0

