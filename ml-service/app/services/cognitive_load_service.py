# from sentence_transformers import SentenceTransformer
# from sklearn.metrics.pairwise import cosine_similarity
# import requests
# from typing import List

# # Load model once (VERY IMPORTANT)
# embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# SIMILARITY_THRESHOLD = 0.55

# OLLAMA_URL = "http://localhost:11434/api/generate"
# OLLAMA_MODEL = "llama3"


# def analyze_cognitive_overlap(subjects):
#     """
#     Cluster lessons across subjects by cognitive similarity
#     and explain shared cognitive skills using Ollama.
#     """

#     lesson_texts = []
#     lesson_meta = []

#     # 1️⃣ Prepare lesson texts
#     for subj in subjects:
#         for lesson in subj.lessons:
#             enriched = f"{subj.subject}: {lesson}. Conceptual and structural understanding required."
#             lesson_texts.append(enriched)

#             lesson_meta.append({
#                 "subject": subj.subject,
#                 "lesson": lesson
#             })

#     # Edge case
#     if len(lesson_texts) < 2:
#         return {
#             "shared_cognitive_load_detected": False,
#             "skill_clusters": []
#         }

#     # 2️⃣ Generate embeddings
#     embeddings = embedding_model.encode(lesson_texts)
#     similarity_matrix = cosine_similarity(embeddings)

#     # 3️⃣ Cluster lessons (graph-style clustering)
#     clusters = build_clusters(similarity_matrix)

#     # 4️⃣ Build clean cluster output
#     skill_clusters = []

#     for cluster in clusters:
#         if len(cluster) < 2:
#             continue  # Ignore single lessons

#         lessons = [lesson_meta[i] for i in cluster]

#         shared_skill = explain_shared_skill(lessons)

#         skill_clusters.append({
#             "shared_skill": shared_skill,
#             "size": len(lessons),
#             "lessons": lessons
#         })

#     return {
#         "shared_cognitive_load_detected": len(skill_clusters) > 0,
#         "skill_clusters": skill_clusters
#     }


# # ----------------- HELPERS ----------------- #

# def build_clusters(similarity_matrix):
#     """
#     Build clusters using similarity threshold.
#     """
#     visited = set()
#     clusters = []

#     for i in range(len(similarity_matrix)):
#         if i in visited:
#             continue

#         cluster = {i}
#         queue = [i]
#         visited.add(i)

#         while queue:
#             current = queue.pop()
#             for j in range(len(similarity_matrix)):
#                 if j not in visited and similarity_matrix[current][j] >= SIMILARITY_THRESHOLD:
#                     visited.add(j)
#                     cluster.add(j)
#                     queue.append(j)

#         clusters.append(list(cluster))

#     return clusters


# def explain_shared_skill(lessons: List[dict]) -> str:
#     """
#     Ask Ollama to explain the shared cognitive skill.
#     """

#     examples = "\n".join([
#         f"- {l['subject']}: {l['lesson']}"
#         for l in lessons[:5]
#     ])

#     prompt = f"""
# The following lessons require similar thinking:

# {examples}

# Describe the shared cognitive skill in ONE short phrase.
# Do NOT explain.
# """

#     payload = {
#         "model": OLLAMA_MODEL,
#         "prompt": prompt,
#         "stream": False
#     }

#     response = requests.post(OLLAMA_URL, json=payload, timeout=60)
#     return response.json().get("response", "").strip()
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import requests
import json
from typing import List

# ---------------- CONFIG ---------------- #

# Load embedding model ONCE
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

SIMILARITY_THRESHOLD = 0.55

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3"


# ---------------- MAIN SERVICE ---------------- #

def analyze_cognitive_overlap(subjects):
    """
    Cluster lessons across subjects by semantic similarity
    and explain shared cognitive skills with reasoning.
    """

    lesson_texts = []
    lesson_meta = []

    # 1️⃣ Prepare lesson texts
    for subj in subjects:
        for lesson in subj.lessons:
            enriched_text = (
                f"{subj.subject}: {lesson}. "
                f"This lesson requires conceptual understanding, abstraction, and reasoning."
            )

            lesson_texts.append(enriched_text)
            lesson_meta.append({
                "subject": subj.subject,
                "lesson": lesson
            })

    # Edge case
    if len(lesson_texts) < 2:
        return {
            "shared_cognitive_load_detected": False,
            "skill_clusters": []
        }

    # 2️⃣ Generate embeddings
    embeddings = embedding_model.encode(lesson_texts)
    similarity_matrix = cosine_similarity(embeddings)

    # 3️⃣ Build clusters
    clusters = build_clusters(similarity_matrix)

    # 4️⃣ Build output
    skill_clusters = []

    for cluster in clusters:
        if len(cluster) < 2:
            continue  # ignore single lessons

        lessons = [lesson_meta[i] for i in cluster]

        explanation = explain_shared_skill_with_reason(lessons)

        skill_clusters.append({
            "shared_skill": explanation["skill"],
            "why_shared": explanation["reason"],
            "size": len(lessons),
            "lessons": lessons
        })

    return {
        "shared_cognitive_load_detected": len(skill_clusters) > 0,
        "skill_clusters": skill_clusters
    }


# ---------------- HELPERS ---------------- #

def build_clusters(similarity_matrix):
    """
    Graph-based clustering using similarity threshold.
    """
    visited = set()
    clusters = []

    for i in range(len(similarity_matrix)):
        if i in visited:
            continue

        cluster = {i}
        queue = [i]
        visited.add(i)

        while queue:
            current = queue.pop()
            for j in range(len(similarity_matrix)):
                if j not in visited and similarity_matrix[current][j] >= SIMILARITY_THRESHOLD:
                    visited.add(j)
                    cluster.add(j)
                    queue.append(j)

        clusters.append(list(cluster))

    return clusters


def explain_shared_skill_with_reason(lessons: List[dict]) -> dict:
    """
    Ask Ollama for:
    - shared cognitive skill name
    - explanation why lessons share it
    """

    examples = "\n".join([
        f"- {l['subject']}: {l['lesson']}"
        for l in lessons[:6]
    ])

    prompt = f"""
The following lessons are cognitively similar:

{examples}

TASK:
1. Give ONE short name for the shared cognitive skill
2. Explain WHY these lessons share this skill in 1–2 sentences

Respond ONLY in valid JSON:

{{
  "skill": "short skill name",
  "reason": "clear explanation"
}}
"""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=60)
    text = response.json().get("response", "")

    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except Exception:
        return {
            "skill": "Cognitive overlap",
            "reason": "These lessons require similar mental processing and conceptual reasoning."
        }
