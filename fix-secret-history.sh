#!/usr/bin/env bash
# ============================================================
# fix-secret-history.sh
#
# Removes the committed GEMINI_API_KEY from .replit in git
# history and pushes a clean branch to GitHub.
#
# RUN THIS IN THE REPLIT SHELL TAB:
#   bash fix-secret-history.sh
# ============================================================
set -euo pipefail

ORIGIN="75b1c92a6a95ef2982adefb78acd2574a1e182b8"

echo ""
echo "=== Step 1: Verify current state ==="
echo "HEAD:         $(git rev-parse HEAD)"
echo "origin/main:  $ORIGIN"
echo "Working tree .replit has secret? $(grep -q 'GEMINI_API_KEY' .replit && echo YES — ABORT && exit 1 || echo NO — clean)"
echo ""

echo "=== Step 2: Soft-reset to origin (keeps all staged changes) ==="
git reset --soft "$ORIGIN"
echo "Done. All code changes remain staged."
echo ""

echo "=== Step 3: Verify .replit is clean before committing ==="
if grep -q 'GEMINI_API_KEY' .replit 2>/dev/null; then
  echo "ERROR: .replit still contains GEMINI_API_KEY — cannot continue."
  exit 1
fi
echo ".replit is clean."
echo ""

echo "=== Step 4: Create one clean squash commit ==="
git add -A
git commit -m "Add disaster management features, AI enhancements, Gemini fix

- Add ImageGalleryPage, DisasterSimulationPage, ReportsPage
- Multi-provider AI fallback (Gemini -> OpenRouter -> Groq)
- Smart quota-exhaustion vs transient-error cooldown logic
- Switch to gemini-2.5-flash-lite (confirmed working model)
- Remove GEMINI_API_KEY from committed .replit (use Replit Secrets)"
echo ""

echo "=== Step 5: Verify NO secret in any commit being pushed ==="
SECRETS_FOUND=0
for sha in $(git log --oneline "$ORIGIN..HEAD" | awk '{print $1}'); do
  if git show "$sha:.replit" 2>/dev/null | grep -q 'GEMINI_API_KEY'; then
    echo "FAIL: Secret still present in commit $sha"
    SECRETS_FOUND=1
  else
    echo "OK:   $sha — no secret"
  fi
done

if [ "$SECRETS_FOUND" -ne 0 ]; then
  echo ""
  echo "Aborting push — secret still found in history."
  exit 1
fi
echo ""

echo "=== Step 6: git grep verification ==="
git grep "AIza" 2>/dev/null && echo "WARNING: AIza pattern found" || echo "git grep AIza — CLEAN"
git grep "AQ\.Ab8" 2>/dev/null && echo "WARNING: AQ.Ab8 pattern found" || echo "git grep AQ.Ab8 — CLEAN"
echo ""

echo "=== Step 7: Push to GitHub ==="
git push --force-with-lease origin main
echo ""
echo "SUCCESS — secret removed from history, push completed."
