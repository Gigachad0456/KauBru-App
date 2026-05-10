import re
from datetime import date, datetime
from typing import Iterable, List, Optional
from urllib.parse import urlparse


QUALIFICATION_OPTIONS = [
    "8th Pass",
    "10th Pass",
    "12th Pass",
    "ITI",
    "Diploma",
    "Graduate",
    "Post Graduate",
    "B.Tech",
    "B.Ed",
    "Nursing",
    "Computer Certificate",
]

JOB_TYPE_OPTIONS = {"Government", "Private"}
JOB_MODERATION_STATUS_OPTIONS = {"pending", "published", "rejected"}
JOB_SORT_OPTIONS = {"latest", "closing", "qualification"}


def normalize_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    clean = url.strip()
    if not clean:
        return None
    parsed = urlparse(clean)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Only valid http/https links are allowed")
    return clean


def infer_job_type(text: str) -> str:
    t = (text or "").lower()
    if any(k in t for k in ("tpsc", "jrbt", "department", "tripura govt", "government", "govt", "public service")):
        return "Government"
    return "Private"


def infer_organization(title: str, detail_text: str = "") -> str:
    combined = f"{title} {detail_text}".lower()
    if "tpsc" in combined:
        return "TPSC"
    if "jrbt" in combined:
        return "JRBT"
    if "tripura police" in combined:
        return "Tripura Police"
    if "tripura" in combined and "health" in combined:
        return "Tripura Health Department"
    if "tripura" in combined and "education" in combined:
        return "Tripura Education Department"
    if "national career service" in combined or "ncs" in combined:
        return "National Career Service"

    # Fallback: take prefix before recruitment / vacancy words
    m = re.match(r"^([A-Za-z0-9 .,&()-]{3,120}?)(?:\s+(?:recruitment|vacancy|notification|advertisement).*)?$", (title or "").strip(), re.IGNORECASE)
    if m and m.group(1):
        return m.group(1).strip()
    return "Tripura Recruitment"


def extract_qualification_tags(text: Optional[str]) -> List[str]:
    if not text:
        return []
    hay = text.lower()
    found: List[str] = []

    checks = [
        ("8th Pass", [r"\b8(th)?\b", r"eighth"]),
        ("10th Pass", [r"\b10(th)?\b", r"matric"]),
        ("12th Pass", [r"\b12(th)?\b", r"higher secondary", r"\bhs\b"]),
        ("ITI", [r"\biti\b"]),
        ("Diploma", [r"\bdiploma\b"]),
        ("Graduate", [r"\bgraduate\b", r"bachelor"]),
        ("Post Graduate", [r"post[ -]?graduate", r"\bpg\b", r"\bmasters?\b"]),
        ("B.Tech", [r"\bb\.?tech\b", r"bachelor of technology"]),
        ("B.Ed", [r"\bb\.?ed\b", r"bachelor of education"]),
        ("Nursing", [r"\bnursing\b", r"\bgnm\b", r"\bbsc nursing\b"]),
        ("Computer Certificate", [r"computer certificate", r"\bdca\b", r"\bpgdca\b", r"\bccc\b"]),
    ]

    for label, patterns in checks:
        if any(re.search(p, hay, re.IGNORECASE) for p in patterns):
            found.append(label)
    return found


def normalize_qualification_tags(tags: Optional[Iterable[str]], qualification_text: Optional[str] = None) -> List[str]:
    allowed = set(QUALIFICATION_OPTIONS)
    clean: List[str] = []

    if tags:
        for tag in tags:
            t = (tag or "").strip()
            if t in allowed and t not in clean:
                clean.append(t)

    if not clean and qualification_text:
        inferred = extract_qualification_tags(qualification_text)
        for tag in inferred:
            if tag in allowed and tag not in clean:
                clean.append(tag)
    return clean


def parse_last_date(text: Optional[str]) -> Optional[date]:
    if not text:
        return None

    # ISO style: 2026-05-30
    m_iso = re.search(r"\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b", text)
    if m_iso:
        y, m, d = map(int, m_iso.groups())
        try:
            return date(y, m, d)
        except ValueError:
            pass

    # DD-MM-YYYY and DD/MM/YYYY
    m_dmy = re.search(r"\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b", text)
    if m_dmy:
        d, m, y = map(int, m_dmy.groups())
        try:
            return date(y, m, d)
        except ValueError:
            pass

    # 12 May 2026 / 12th May, 2026
    m_word = re.search(
        r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})[,]?\s+(20\d{2})\b",
        text,
        re.IGNORECASE,
    )
    if m_word:
        d_s, month_s, y_s = m_word.groups()
        month_map = {
            "jan": 1,
            "feb": 2,
            "mar": 3,
            "apr": 4,
            "may": 5,
            "jun": 6,
            "jul": 7,
            "aug": 8,
            "sep": 9,
            "oct": 10,
            "nov": 11,
            "dec": 12,
        }
        month = month_map.get(month_s[:3].lower())
        if month:
            try:
                return date(int(y_s), month, int(d_s))
            except ValueError:
                pass

    return None


def compute_is_open(last_date: Optional[date]) -> bool:
    if not last_date:
        return True
    return last_date >= datetime.utcnow().date()


def to_public_job_status(is_open: bool) -> str:
    return "Open" if is_open else "Closed"
