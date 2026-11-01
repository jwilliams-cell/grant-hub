"""The demo script (Jasmine's voice) and natural word timings, ~165 wpm, for the stand-in take."""
import json, re, sys

LINES = [
    "Buying your first home in Philly starts with a plan.",
    "It's how my buyers go from not ready to under contract.",
    "Here's the part nobody explains.",
    "There are four stops between you and the keys.",
    "One: your middle score.",
    "Say yours are 641, 668 and 702.",
    "Lenders use the middle one.",
    "Two: savings. Less than you think.",
    "Three: down payment help. Philly has grants.",
    "Four: pre-approval.",
    "Then we find your block. Your street. Your house.",
    "And one day, the keys are yours.",
    "That's how you build wealth, brick by brick.",
    "Comment PLAN and I'll send you yours.",
]
SPOKEN = {"641,": 4, "668": 4, "702.": 4, "pre-approval.": 5, "Philly": 2, "PLAN": 1}

def syll(w):
    if w in SPOKEN:
        return SPOKEN[w]
    s = re.sub(r"[^a-z]", "", w.lower())
    n = len(re.findall(r"[aeiouy]+", s))
    if s.endswith("e") and n > 1 and not s.endswith(("le", "ee")):
        n -= 1
    return max(1, n)

t, words, lines = 0.30, [], []
for li, line in enumerate(LINES):
    ws = line.split()
    l0 = t
    for k, w in enumerate(ws):
        d = max(0.17, 0.07 + 0.135 * syll(w))
        words.append({"text": w, "start": round(t, 3), "end": round(t + d, 3), "src": round(t, 3)})
        t += d
        if k < len(ws) - 1:
            t += 0.22 if w.endswith((",", ":")) else 0.34 if w.endswith(".") else 0.035
    lines.append((li + 1, round(l0, 3), round(t, 3), line))
    t += 0.42
total = round(t + 0.1, 3)
json.dump(words, open("words.json", "w"), indent=1)
json.dump({"lines": lines, "total": total}, open("lines.json", "w"), indent=1)
for n, a, b, l in lines:
    print(f"L{n:<2} {a:6.2f}-{b:6.2f}  {l}")
print("speech ends", round(t - 0.42, 3), " clip length", total)
