"""
validate_dataset.py
Run:  python validate_dataset.py
Checks all four JSON files for completeness and consistency.
"""
import json, sys

PASS = 0
FAIL = 0

def ok(msg):
    global PASS
    PASS += 1
    print(f"  [PASS] {msg}")

def fail(msg):
    global FAIL
    FAIL += 1
    print(f"  [FAIL] {msg}")

def check(condition, pass_msg, fail_msg):
    if condition:
        ok(pass_msg)
    else:
        fail(fail_msg)

def load(filename):
    with open(filename, encoding="utf-8") as f:
        return json.load(f)

print("=" * 60)
print("DATASET VALIDATION REPORT")
print("=" * 60)

# ── words.json ────────────────────────────────────────────────
print("\n[words.json]")
data = load("words.json")
words = data["words"]
meta = data["metadata"]

check(len(words) > 0, f"{len(words)} words loaded", "No words found")
check(meta["total_words"] == len(words), "total_words count matches", f"Count mismatch: meta={meta['total_words']} actual={len(words)}")

empty_pron = [w["id"] for w in words if not w.get("pronunciation","").strip()]
check(len(empty_pron) == 0, "All words have pronunciation", f"{len(empty_pron)} words missing pronunciation: {empty_pron[:5]}")

empty_pos = [w["id"] for w in words if not w.get("part_of_speech","").strip()]
check(len(empty_pos) == 0, "All words have part_of_speech", f"{len(empty_pos)} words missing part_of_speech")

no_related = [w["id"] for w in words if not w.get("related_words")]
print(f"  [INFO] {len(no_related)} words have no related_words (may be intentional)")

no_examples = [w["id"] for w in words if not w.get("usage_examples") or not w["usage_examples"][0].get("kaubru","").strip()]
check(len(no_examples) == 0, "All words have usage examples", f"{len(no_examples)} words missing usage examples")

# ── phrases.json ──────────────────────────────────────────────
print("\n[phrases.json]")
data = load("phrases.json")
phrases = data["phrases"]

check(len(phrases) > 0, f"{len(phrases)} phrases loaded", "No phrases found")

empty_pron = [p["id"] for p in phrases if not p.get("pronunciation","").strip()]
check(len(empty_pron) == 0, "All phrases have pronunciation", f"{len(empty_pron)} phrases missing pronunciation")

empty_cultural = [p["id"] for p in phrases if not p.get("cultural_context","").strip()]
print(f"  [INFO] {len(empty_cultural)} phrases have no cultural_context (can add later)")

empty_breakdown = [p["id"] for p in phrases if not p.get("word_breakdown")]
print(f"  [INFO] {len(empty_breakdown)} phrases have no word_breakdown (can add later)")

# ── sentences.json ────────────────────────────────────────────
print("\n[sentences.json]")
data = load("sentences.json")
sentences = data["sentences"]

check(len(sentences) > 0, f"{len(sentences)} sentences loaded", "No sentences found")

empty_pron = [s["id"] for s in sentences if not s.get("pronunciation","").strip()]
check(len(empty_pron) == 0, "All sentences have pronunciation", f"{len(empty_pron)} sentences missing pronunciation")

no_grammar = [s["id"] for s in sentences if not s.get("grammar_points")]
check(len(no_grammar) == 0, "All sentences have grammar_points", f"{len(no_grammar)} sentences missing grammar_points")

no_lesson = [s["id"] for s in sentences if not s.get("lesson_id","").strip()]
check(len(no_lesson) == 0, "All sentences have lesson_id", f"{len(no_lesson)} sentences missing lesson_id")

with_breakdown = [s for s in sentences if s.get("word_breakdown")]
print(f"  [INFO] {len(with_breakdown)}/{len(sentences)} sentences have word_breakdown")

# ── grammar_rules.json ────────────────────────────────────────
print("\n[grammar_rules.json]")
data = load("grammar_rules.json")
rules = data["grammar_rules"]

check(len(rules) > 0, f"{len(rules)} grammar rules loaded", "No grammar rules found")

no_kaubru_title = [r["id"] for r in rules if not r.get("title_kaubru","").strip()]
check(len(no_kaubru_title) == 0, "All rules have Kaubru title", f"{len(no_kaubru_title)} rules missing title_kaubru")

no_kaubru_desc = [r["id"] for r in rules if not r.get("description_kaubru","").strip()]
check(len(no_kaubru_desc) == 0, "All rules have Kaubru description", f"{len(no_kaubru_desc)} rules missing description_kaubru")

no_examples = [r["id"] for r in rules if not r.get("examples")]
check(len(no_examples) == 0, "All rules have examples", f"{len(no_examples)} rules missing examples")

no_exercises = [r["id"] for r in rules if not r.get("practice_exercises")]
check(len(no_exercises) == 0, "All rules have practice exercises", f"{len(no_exercises)} rules missing practice_exercises")

# ── Cross-file consistency ────────────────────────────────────
print("\n[Cross-file consistency]")
words_data = load("words.json")
sentences_data = load("sentences.json")
grammar_data = load("grammar_rules.json")

grammar_ids = {r["id"] for r in grammar_data["grammar_rules"]}
bad_refs = []
for s in sentences_data["sentences"]:
    for gp in s.get("grammar_points", []):
        if gp not in grammar_ids:
            bad_refs.append((s["id"], gp))
check(len(bad_refs) == 0, "All grammar_points in sentences reference valid rule IDs",
      f"{len(bad_refs)} broken grammar_point references: {bad_refs[:3]}")

# ── Summary ───────────────────────────────────────────────────
print("\n" + "=" * 60)
total = PASS + FAIL
print(f"RESULT: {PASS}/{total} checks passed  |  {FAIL} failed")
if FAIL == 0:
    print("All checks passed! Dataset is ready.")
else:
    print("Fix the FAIL items above, then re-run generate_dataset.py")
print("=" * 60)
sys.exit(0 if FAIL == 0 else 1)
