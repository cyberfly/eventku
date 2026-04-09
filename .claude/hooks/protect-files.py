#!/usr/bin/env python3
import json, sys, os

# add files to protect here
PROTECTED = []

try:
    data = json.load(sys.stdin)
    file_path = data.get("tool_input", {}).get("file_path", "")
    cwd = os.getcwd()
    rel = os.path.relpath(file_path, cwd) if os.path.isabs(file_path) else file_path
    if any(rel == p or rel.endswith("/" + p) for p in PROTECTED):
        print(f"BLOCKED: {rel} is a protected file and cannot be edited.", file=sys.stderr)
        sys.exit(2)
except Exception:
    pass
