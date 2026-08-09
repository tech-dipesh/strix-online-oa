import re

MAX_CHARS_PER_FILE = 4000
STOPWORDS = {
    "the", "is", "at", "which", "on", "a", "an", "and", "or", "how", "does",
    "do", "what", "where", "in", "of", "to", "for", "this", "that", "with",
}


def tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z0-9_]+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 1}


def find_relevant_files(files: list[dict], query: str, top_k: int = 5) -> list[dict]:
    query_words = tokenize(query)
    if not query_words:
        return files[:top_k]

    scored = []
    for f in files:
        path_words = tokenize(f["path"])
        content_words = tokenize(f["content"][:5000])

        score = len(query_words & path_words) * 3 + len(query_words & content_words)
        scored.append((score, f))

    scored.sort(key=lambda pair: pair[0], reverse=True)

    top = [f for score, f in scored[:top_k] if score > 0]
    if not top:
        top = [f for _, f in scored[:top_k]]

    return top


def build_context_block(files: list[dict]) -> str:
    sections = []
    for f in files:
        truncated = f["content"][:MAX_CHARS_PER_FILE]
        sections.append(f"--- FILE: {f['path']} ---\n{truncated}")
    return "\n\n".join(sections)
