from ulid import ULID


def generate_ulid():
    return str(ULID())
