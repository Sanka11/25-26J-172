# ml-service/app/llm.py
import subprocess, shlex, json, sys, time
from .config import OLLAMA_MODEL, OLLAMA_TIMEOUT

def call_ollama(prompt: str, model: str = OLLAMA_MODEL, max_tokens: int = 800):
    # This uses the Ollama CLI. Adjust if your local workflow uses a different command or REST API.
    cmd = f'ollama generate {model} --prompt "{prompt.replace("\"", "\\\"")}" --max-tokens {max_tokens}'
    try:
        proc = subprocess.run(shlex.split(cmd), capture_output=True, text=True, timeout=OLLAMA_TIMEOUT)
        if proc.returncode != 0:
            return f"LLM Error: {proc.stderr}"
        return proc.stdout.strip()
    except Exception as e:
        return f"LLM call failed: {str(e)}"
