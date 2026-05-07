# Hosted proof next-ops plan

> For Hermes: use subagent-driven-development style review before executing any side-effectful git step.

Goal: safely decide whether to commit/push the current `scripts/collect-ops-evidence.ps1` delta, and if so, do it with minimal scope plus copy-pasteable GitHub observation commands.

Architecture: freeze live truth first, reconcile three independent critique passes, then separate `execute now`, `postpone`, and `out of scope`. This is an operations plan, not an implementation spec. It assumes the repo is already dirty and therefore prioritizes commit-scope isolation over speed.

Tech stack: git, GitHub REST API, pnpm, PowerShell script lane (`scripts/collect-ops-evidence.ps1`).

---

## 0. Frozen live truth

Confirmed from live repo/API checks during this session:

- Repo root: `/mnt/c/Users/sunwo/workspace/inMyPoket`
- Branch: `codex/hosted-proof-pr`
- Current local HEAD: `9c0c4810845da13d911584098323dcd40d14dd47`
- Remote PR linkage:
  - PR #1
  - `https://github.com/SunwooPark-dev/inMyPocket/pull/1`
- Current local working tree is very dirty.
- Intended local candidate diff is still only:
  - `scripts/collect-ops-evidence.ps1`
- Latest observed hosted run for current HEAD already exists and is green:
  - run id: `24593076531`
  - URL: `https://github.com/SunwooPark-dev/inMyPocket/actions/runs/24593076531`
- Latest observed check runs for current HEAD:
  - `quality-gate`: success
  - `ops-evidence-gate`: success

Implication:
- The hosted recovery lane is no longer blocked on the currently pushed HEAD.
- Any new commit from the current working tree should be treated as a new optional slice, not as a mandatory recovery step for the already-green hosted lane.

---

## 1. Three-pass critique reconciliation

### Pass A — operator value
Kept:
- freeze scope to one file only
- verify unstaged diff and staged diff separately
- do not touch unrelated dirty files

Changed after reconciliation:
- because current PR head is already green, `execute now` becomes “decide whether this local delta is still worth shipping”, not “push immediately to unblock hosted proof”

### Pass B — engineering risk
Historical note: this section predates the hardened no-direct-grants contract. Read `restProof` below as a direct-grant boundary proof: publishable-key REST must be denied or return zero governed rows.

Kept:
- `restProof` must remain a hard gate
- `liveSupabaseProofRequested` vs availability split is the actual semantic fix
- `pnpm ops:evidence` is the most relevant final behavioral check for this slice

Changed after reconciliation:
- since hosted run is already green on current HEAD, the engineering question is now whether this local diff is still additive and desired, not whether it is urgently needed to recover CI

### Pass C — GitHub workflow / observability
Kept:
- public GitHub API is the reliable observation fallback
- use branch-filtered and head-SHA-filtered queries
- verify PR linkage, runs, jobs, artifacts, and check-runs

Corrected by controller:
- one reviewer accidentally centered `.github/workflows/ci.yml`; ignore that part
- the actual allowed path for this plan remains:
  - `scripts/collect-ops-evidence.ps1`

---

## 2. Execute now

### Option A — no new commit yet (recommended default)
Use this if the goal is to avoid unnecessary churn because the currently pushed HEAD is already green.

1. Reconfirm that hosted lane is already green for current HEAD
2. Keep the local delta uncommitted until there is a clear reason to ship it
3. Use the API commands in section 6 when observing future runs

### Option B — ship the one-file delta as a new deliberate slice
Use this only if, after reading the diff again, you still want the semantic tightening in `scripts/collect-ops-evidence.ps1` to become the new branch truth.

Execution sequence:
1. run last unstaged sanity check
2. stage exactly one path
3. verify cached diff is still exactly one path
4. optionally rerun focused verification
5. commit with explicit message
6. push branch
7. observe the new run via API

---

## 3. Postpone

- dirty-tree cleanup across the rest of the repository
- staging or committing any other modified tracked file
- `.ops-evidence/` and temp/log directories cleanup unless they block a command
- any broader docs/workflow/app refactor
- any claim that hosted attestation needs recovery on current pushed HEAD

---

## 4. Freeze before coding / before git side effects

- no `git add .`
- no `git commit -a`
- no branch switch, rebase, merge, or pull before scope is sealed
- no editing any file other than `scripts/collect-ops-evidence.ps1` if this slice is chosen
- no claiming this push is required for hosted closure; current pushed HEAD is already green

Allowed path if shipping this slice:
- `scripts/collect-ops-evidence.ps1`

Out of scope for this plan:
- `.github/workflows/ci.yml`
- wiki updates
- stateful resume engine implementation
- broad repo cleanup

---

## 5. Copy-paste command sets

### 5.1 Last unstaged sanity check for the one-file slice
```bash
cd /mnt/c/Users/sunwo/workspace/inMyPoket

git branch --show-current
git rev-parse HEAD
git remote -v

git diff --stat -- scripts/collect-ops-evidence.ps1
git diff -- scripts/collect-ops-evidence.ps1
```

Expected:
- branch is `codex/hosted-proof-pr`
- diff is only the semantic PowerShell change you reviewed

### 5.2 Stage and inspect exactly one file
```bash
cd /mnt/c/Users/sunwo/workspace/inMyPoket

git add -- scripts/collect-ops-evidence.ps1

git diff --cached --name-only
git diff --cached --stat -- scripts/collect-ops-evidence.ps1
git diff --cached -- scripts/collect-ops-evidence.ps1

git status --short
```

Hard stop if:
- cached diff contains any path other than `scripts/collect-ops-evidence.ps1`

### 5.3 Optional focused verification before commit
```bash
cd /mnt/c/Users/sunwo/workspace/inMyPoket

pnpm typecheck
pnpm test
pnpm build
pnpm ops:evidence
```

Note:
- if you only want a minimal operations proof for this slice, `pnpm ops:evidence` is the most behaviorally relevant command
- but the previously used four-command gate remains the safest pre-push bundle

### 5.4 Commit the one-file slice
```bash
cd /mnt/c/Users/sunwo/workspace/inMyPoket

git commit -m "fix: treat missing Supabase link as unavailable without weakening REST proof gate"

git show --stat --oneline HEAD
git diff HEAD^ HEAD -- scripts/collect-ops-evidence.ps1
```

### 5.5 Push the branch
```bash
cd /mnt/c/Users/sunwo/workspace/inMyPoket

git push origin HEAD:codex/hosted-proof-pr
```

### 5.6 Final push-preflight alternative
If you want one compact command before push:
```bash
cd /mnt/c/Users/sunwo/workspace/inMyPoket && \
  git diff --cached --name-only && \
  git show --stat --oneline HEAD && \
  git rev-parse HEAD
```

---

## 6. GitHub API observation commands

These commands are the minimum useful observation set in this environment.

### 6.1 Confirm PR linkage for this branch
```bash
python3 - <<'PY'
import json, urllib.request
url='https://api.github.com/repos/SunwooPark-dev/inMyPocket/pulls?state=open&head=SunwooPark-dev:codex/hosted-proof-pr'
req=urllib.request.Request(url, headers={'Accept':'application/vnd.github+json','User-Agent':'Hermes-Agent'})
with urllib.request.urlopen(req, timeout=30) as r:
    data=json.load(r)
print(json.dumps([
  {
    'number': pr.get('number'),
    'html_url': pr.get('html_url'),
    'head_sha': pr.get('head', {}).get('sha'),
    'base_ref': pr.get('base', {}).get('ref')
  }
  for pr in data
], ensure_ascii=False, indent=2))
PY
```

### 6.2 List latest runs for this branch
```bash
python3 - <<'PY'
import json, urllib.request
url='https://api.github.com/repos/SunwooPark-dev/inMyPocket/actions/runs?branch=codex/hosted-proof-pr&per_page=5'
req=urllib.request.Request(url, headers={'Accept':'application/vnd.github+json','User-Agent':'Hermes-Agent'})
with urllib.request.urlopen(req, timeout=30) as r:
    data=json.load(r)
print(json.dumps([
  {
    'id': run.get('id'),
    'head_sha': run.get('head_sha'),
    'status': run.get('status'),
    'conclusion': run.get('conclusion'),
    'html_url': run.get('html_url')
  }
  for run in data.get('workflow_runs', [])[:5]
], ensure_ascii=False, indent=2))
PY
```

### 6.3 List latest runs for a specific HEAD SHA
Replace `TARGET_SHA` if you just pushed a new commit.
```bash
TARGET_SHA=$(git rev-parse HEAD)
python3 - <<'PY'
import json, os, urllib.request
sha=os.environ['TARGET_SHA']
url=f'https://api.github.com/repos/SunwooPark-dev/inMyPocket/actions/runs?head_sha={sha}&per_page=5'
req=urllib.request.Request(url, headers={'Accept':'application/vnd.github+json','User-Agent':'Hermes-Agent'})
with urllib.request.urlopen(req, timeout=30) as r:
    data=json.load(r)
print(json.dumps([
  {
    'id': run.get('id'),
    'head_sha': run.get('head_sha'),
    'status': run.get('status'),
    'conclusion': run.get('conclusion'),
    'html_url': run.get('html_url')
  }
  for run in data.get('workflow_runs', [])[:5]
], ensure_ascii=False, indent=2))
PY
```

### 6.4 Inspect jobs for one run
Replace `RUN_ID`.
```bash
RUN_ID=24593076531
python3 - <<'PY'
import json, os, urllib.request
run_id=os.environ['RUN_ID']
url=f'https://api.github.com/repos/SunwooPark-dev/inMyPocket/actions/runs/{run_id}/jobs?per_page=20'
req=urllib.request.Request(url, headers={'Accept':'application/vnd.github+json','User-Agent':'Hermes-Agent'})
with urllib.request.urlopen(req, timeout=30) as r:
    data=json.load(r)
print(json.dumps([
  {
    'name': job.get('name'),
    'status': job.get('status'),
    'conclusion': job.get('conclusion'),
    'html_url': job.get('html_url'),
    'steps': [
      {
        'name': step.get('name'),
        'status': step.get('status'),
        'conclusion': step.get('conclusion')
      }
      for step in job.get('steps', [])
    ]
  }
  for job in data.get('jobs', [])
], ensure_ascii=False, indent=2))
PY
```

### 6.5 Inspect artifacts for one run
Replace `RUN_ID`.
```bash
RUN_ID=24593076531
python3 - <<'PY'
import json, os, urllib.request
run_id=os.environ['RUN_ID']
url=f'https://api.github.com/repos/SunwooPark-dev/inMyPocket/actions/runs/{run_id}/artifacts?per_page=20'
req=urllib.request.Request(url, headers={'Accept':'application/vnd.github+json','User-Agent':'Hermes-Agent'})
with urllib.request.urlopen(req, timeout=30) as r:
    data=json.load(r)
print(json.dumps([
  {
    'id': artifact.get('id'),
    'name': artifact.get('name'),
    'size_in_bytes': artifact.get('size_in_bytes'),
    'expired': artifact.get('expired'),
    'url': artifact.get('archive_download_url')
  }
  for artifact in data.get('artifacts', [])
], ensure_ascii=False, indent=2))
PY
```

### 6.6 Inspect check-runs for the current HEAD
```bash
TARGET_SHA=$(git rev-parse HEAD)
python3 - <<'PY'
import json, os, urllib.request
sha=os.environ['TARGET_SHA']
url=f'https://api.github.com/repos/SunwooPark-dev/inMyPocket/commits/{sha}/check-runs'
req=urllib.request.Request(url, headers={'Accept':'application/vnd.github+json','User-Agent':'Hermes-Agent'})
with urllib.request.urlopen(req, timeout=30) as r:
    data=json.load(r)
print(json.dumps([
  {
    'name': cr.get('name'),
    'status': cr.get('status'),
    'conclusion': cr.get('conclusion'),
    'html_url': cr.get('html_url')
  }
  for cr in data.get('check_runs', [])
], ensure_ascii=False, indent=2))
PY
```

---

## 7. Decision rule

Use this rule before executing side effects:

- If your intent is only to confirm hosted recovery status:
  - stop now; current pushed HEAD is already green
- If your intent is to make `scripts/collect-ops-evidence.ps1` itself the new branch truth:
  - follow section 5 in order
  - then observe the new run with section 6

---

## 8. Ready-to-use operator summary

- On-track verdict: yes, but the situation changed
- Important update: hosted proof recovery is already green on pushed HEAD `9c0c481`
- Therefore the next commit is not a recovery necessity; it is a discretionary follow-up slice
- Safest default: do not push anything until you consciously decide this one-file diff still matters
- If you do ship it, stage exactly one file and use the API observation commands above to verify the new run
