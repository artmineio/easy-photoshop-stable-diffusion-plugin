from collections import defaultdict
from functools import reduce


def group_by(collection, predicate):
    return reduce(lambda grouped, val: grouped[str(predicate(val))].append(val) or grouped, collection, defaultdict(list))
