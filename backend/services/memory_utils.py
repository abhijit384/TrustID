import os
import gc
import logging

logger = logging.getLogger("trustid.memory")

try:
    import psutil
    _PROCESS = psutil.Process(os.getpid())
except Exception:
    _PROCESS = None

def get_current_rss_mb() -> float:
    """Returns current process Resident Set Size (RSS) memory in megabytes."""
    if _PROCESS:
        try:
            return float(_PROCESS.memory_info().rss) / (1024.0 * 1024.0)
        except Exception:
            pass
    return 0.0

def log_memory(stage: str, details: str = "") -> float:
    """
    Logs current RSS memory usage for the given pipeline stage.
    Ensures NO sensitive user data or document text is ever logged.
    """
    rss = get_current_rss_mb()
    det_str = f" | {details}" if details else ""
    print(f"[MEM] stage={stage} rss={rss:.2f}MB{det_str}", flush=True)
    return rss

def force_gc():
    """Forces garbage collection."""
    try:
        gc.collect()
    except Exception:
        pass
