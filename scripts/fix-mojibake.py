"""Repair UTF-8 text that was double-encoded through a cp1252 round-trip
(e.g. "—" -> "â€”"). Per-line, so untouched lines stay untouched.
Usage: python scripts\\fix-mojibake.py <file> [<file> ...]
"""
import sys, pathlib

MARKERS = ("â€", "â†", "Ã", "Â", "âœ", "â˜", "â–", "ðŸ", "âš", "â„")

def fix_line(line: str) -> str:
    if not any(m in line for m in MARKERS):
        return line
    try:
        return line.encode("cp1252").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return line

for arg in sys.argv[1:]:
    p = pathlib.Path(arg)
    raw = p.read_bytes()
    text = raw.decode("utf-8")
    fixed = "".join(fix_line(l) for l in text.splitlines(keepends=True))
    if fixed != text:
        p.write_bytes(fixed.encode("utf-8"))
        print(f"fixed   {p}")
    else:
        print(f"clean   {p}")
