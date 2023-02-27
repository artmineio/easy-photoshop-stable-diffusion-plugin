from __future__ import annotations

from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from automatic1111.results import Automatic1111Result, Automatic1111ResultGroup, Automatic1111ResultGroupItem
from utils.collection_utils import group_by
from utils.constants import RESULTS_LOG_PATH

router = APIRouter()


MAX_RESULT_GROUPS = 20


class GetResultsResponse(BaseModel):
    result_groups: List[Automatic1111ResultGroup]


@router.post("/results/get-all")
def get_all_results():
    results = []
    try:
        with open(RESULTS_LOG_PATH) as f:
            lines = f.readlines()
            for line in lines:
                results.append(Automatic1111Result.from_log_line(line))
    except FileNotFoundError:
        # This can happen on the first launch
        return GetResultsResponse(result_groups=[])

    result_groups_by_request_id = group_by(results, lambda result: result.request_id)
    result_groups = sorted(list(map(
        lambda result_group: Automatic1111ResultGroup(
            timestamp=result_group[0].timestamp,
            document_id=result_group[0].document_id,
            request_id=result_group[0].request_id,
            prompt=result_group[0].prompt,
            negative_prompt=result_group[0].negative_prompt,
            group_items=sorted(list(map(
                lambda result: Automatic1111ResultGroupItem(
                    image_file_name=result.image_file_name,
                    thumbnail_file_name=result.thumbnail_file_name,
                    seed=result.seed,
                    subseed=result.subseed,
                    cfg_scale=result.cfg_scale,
                    denoising_strength=result.denoising_strength,
                ),
                result_group,
                # Sort results within group by file name
            )), key=lambda group_item: group_item.image_file_name),
        ),
        result_groups_by_request_id.values(),
        # Sort groups by timestamp decreasing
    )), key=lambda result_group: result_group.timestamp, reverse=True)
    return GetResultsResponse(
        # Limit the number of results to avoid taking too much memory/making it too slow
        result_groups=result_groups[:MAX_RESULT_GROUPS],
    )
