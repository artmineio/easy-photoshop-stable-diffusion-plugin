from datetime import datetime


def current_time_as_string() -> str:
    return datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
