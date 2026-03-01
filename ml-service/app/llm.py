# """Utilities for calling the local Ollama LLM via CLI."""

# import subprocess
# from .config import OLLAMA_MODEL, OLLAMA_TIMEOUT


# def call_ollama(prompt: str, model: str = OLLAMA_MODEL, max_tokens: int = 800):
#     """Call Ollama using its CLI.

#     Most recent Ollama versions use the `run` subcommand rather than
#     `generate`, which is why a previous implementation failed with
#     "unknown command 'generate'".
#     """
#     # Note: the simple CLI "run" command does not expose max_tokens
#     # consistently across versions, so we omit it for compatibility.
#     # We send the prompt via stdin to avoid unsupported flags like "-p".
#     cmd = ["ollama", "run", model]
#     try:
#         proc = subprocess.run(
#             cmd,
#             capture_output=True,
#             text=True,
#             input=prompt,
#             timeout=OLLAMA_TIMEOUT,
#         )
#         if proc.returncode != 0:
#             stderr = (proc.stderr or "").strip()
#             stdout = (proc.stdout or "").strip()
#             msg = stderr or stdout or "Unknown error from Ollama CLI"
#             return f"LLM Error: {msg}"
#         return proc.stdout.strip()
#     except FileNotFoundError:
#         return "LLM Error: 'ollama' CLI not found. Ensure Ollama is installed and on PATH."
#     except Exception as e:
#         return f"LLM call failed: {str(e)}"
# """Utilities for calling the local Ollama LLM via CLI."""

# import subprocess
# from .config import OLLAMA_MODEL, OLLAMA_TIMEOUT


# def call_ollama(prompt: str, model: str = OLLAMA_MODEL):
#     cmd = ["ollama", "run", model]

#     try:
#         proc = subprocess.run(
#             cmd,
#             capture_output=True,
#             text=True,
#             input=prompt,
#             timeout=OLLAMA_TIMEOUT,
#             encoding="utf-8",      # ✅ important
#             errors="replace"       # ✅ prevents crash
#         )

#         if proc.returncode != 0:
#             stderr = (proc.stderr or "").strip()
#             stdout = (proc.stdout or "").strip()
#             msg = stderr or stdout or "Unknown error from Ollama CLI"
#             return f"LLM Error: {msg}"

#         response = proc.stdout.strip()

#         # remove problematic unicode spaces
#         response = response.replace("\u202f", " ")

#         return response

#     except FileNotFoundError:
#         return "LLM Error: 'ollama' CLI not found."
#     except Exception as e:
#         return f"LLM call failed: {str(e)}"


"""
Utilities for calling the local Ollama LLM via CLI.
This version is SAFE for Windows encoding & Unicode output.
"""

import subprocess
from .config import OLLAMA_MODEL, OLLAMA_TIMEOUT


def call_ollama(prompt: str, model: str = OLLAMA_MODEL):
    """
    Sends a prompt to the local Ollama model and returns the response.
    """

    cmd = ["ollama", "run", model]

    try:
        proc = subprocess.run(
            cmd,
            input=prompt,
            capture_output=True,
            text=True,
            timeout=OLLAMA_TIMEOUT,

            # ✅ IMPORTANT: prevent Windows encoding crashes
            encoding="utf-8",
            errors="replace",
        )

        if proc.returncode != 0:
            stderr = (proc.stderr or "").strip()
            stdout = (proc.stdout or "").strip()
            msg = stderr or stdout or "Unknown error from Ollama CLI"
            return f"LLM Error: {msg}"

        # Raw response
        response = proc.stdout

        # ✅ REMOVE problematic unicode characters
        response = response.replace("\u202f", " ")   # narrow non-breaking space
        response = response.replace("\xa0", " ")     # non-breaking space

        # ✅ Ensure safe UTF-8 text
        response = response.encode("utf-8", "ignore").decode("utf-8")

        return response.strip()

    except FileNotFoundError:
        return "LLM Error: 'ollama' CLI not found. Ensure Ollama is installed."

    except subprocess.TimeoutExpired:
        return "LLM Error: Model took too long to respond."

    except Exception as e:
        return f"LLM call failed: {str(e)}"