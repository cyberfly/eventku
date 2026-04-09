import json
import sys
import os

data = json.load(sys.stdin)
file_path = data.get('tool_input', {}).get('file_path', '')
basename = os.path.basename(file_path)

protected = ['router.tsx', 'stripe.ts', '.env.example']

if basename in protected:
    print(json.dumps({'decision': 'block', 'reason': f'{basename} is protected and cannot be edited.'}))
    sys.exit(0)
