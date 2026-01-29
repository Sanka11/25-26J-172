# import requests
# import json

# OLLAMA_URL = "http://localhost:11434/api/generate"
# MODEL_NAME = "llama3"

# def career_readiness_assessment(user_skills: str, job_title: str):
#     prompt = f"""
# You are an expert career advisor system.

# Job title:
# {job_title}

# User skills:
# {user_skills}

# TASK:
# 1. Infer the typical skills required for the given job title
# 2. Compare them with the user skills
# 3. Assess career readiness
# 4. Identify strengths and weaknesses
# 5. Suggest learning topics (NO course links)

# Respond ONLY in valid JSON:

# {{
#   "career_readiness_score": number between 0 and 1,
#   "decision": "Ready" | "Partially Ready" | "Not Ready",
#   "strengths": [list of strings],
#   "weaknesses": [list of strings],
#   "learning_topics": [list of strings],
#   "recommendation": string
# }}
# """
#     payload = {
#         "model": MODEL_NAME,
#         "prompt": prompt,
#         "stream": False
#     }

#     response = requests.post(OLLAMA_URL, json=payload, timeout=60)
#     result = response.json()

#     try:
#         return json.loads(result["response"])
#     except Exception:
#         return {
            
#             "strengths": [],
#             "weaknesses": [],
#             "learning_topics": [],
#             "recommendation": "Unable to assess career readiness"
#         }
import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"


def extract_json(text: str):
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except Exception:
        return None


def career_readiness_assessment(user_skills: str, job_title: str):
    prompt = f"""
You are an expert career advisor system.

Job title:
{job_title}

User skills:
{user_skills}

TASK:
1. Infer the typical skills required for the given job title
2. Compare them with the user skills
3. Identify strengths
4. Identify weaknesses
5. Suggest learning topics (NO course links)
6. Provide a clear recommendation

IMPORTANT:
- Do NOT calculate numeric scores
- Do NOT label the user as Ready/Not Ready
- Respond ONLY in valid JSON
- Do NOT include explanations outside JSON

Respond in this JSON format ONLY:

{{
  "strengths": [list of strings],
  "weaknesses": [list of strings],
  "learning_topics": [list of strings],
  "recommendation": string
}}
"""

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=60)
    result = response.json()

    parsed = extract_json(result.get("response", ""))

    if parsed:
        return parsed

    return {
        "strengths": [],
        "weaknesses": [],
        "learning_topics": [],
        "recommendation": "Unable to assess career readiness"
    }
