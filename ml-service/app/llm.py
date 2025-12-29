"""Utilities for calling the local Ollama LLM via CLI."""

import subprocess
from .config import OLLAMA_MODEL, OLLAMA_TIMEOUT


def call_ollama(prompt: str, model: str = OLLAMA_MODEL, max_tokens: int = 800):
    """Call Ollama using its CLI.

    Most recent Ollama versions use the `run` subcommand rather than
    `generate`, which is why a previous implementation failed with
    "unknown command 'generate'".
    """
    # Note: the simple CLI "run" command does not expose max_tokens
    # consistently across versions, so we omit it for compatibility.
    # We send the prompt via stdin to avoid unsupported flags like "-p".
    cmd = ["ollama", "run", model]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            input=prompt,
            timeout=OLLAMA_TIMEOUT,
        )
        if proc.returncode != 0:
            stderr = (proc.stderr or "").strip()
            stdout = (proc.stdout or "").strip()
            msg = stderr or stdout or "Unknown error from Ollama CLI"
            return f"LLM Error: {msg}"
        return proc.stdout.strip()
    except FileNotFoundError:
        return "LLM Error: 'ollama' CLI not found. Ensure Ollama is installed and on PATH."
    except Exception as e:
        return f"LLM call failed: {str(e)}"
