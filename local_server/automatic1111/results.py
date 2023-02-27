from __future__ import annotations

from typing import Optional, List

from pydantic import BaseModel

from utils.exceptions import bad_request


class Automatic1111Result(BaseModel):
    timestamp: str
    image_file_name: str
    thumbnail_file_name: str
    document_id: int
    request_id: str
    seed: int
    subseed: int
    cfg_scale: float
    denoising_strength: Optional[float]
    prompt: str
    negative_prompt: str

    def to_log_line(self) -> str:
        return f"{self.timestamp}\t{self.image_file_name}\t{self.thumbnail_file_name}\t" \
               f"{self.document_id}\t{self.request_id}\t" \
               f"{self.seed}\t{self.subseed}\t" \
               f"{self.cfg_scale}\t{self.denoising_strength}\t" \
               f"{self.prompt}\t{self.negative_prompt}\n"

    @staticmethod
    def from_log_line(log_line: str) -> Automatic1111Result:
        splits = log_line.replace("\n", "").split("\t")
        if len(splits) != 11:
            raise bad_request(f"Cannot parse response log line {splits}")
        timestamp, image_file_name, thumbnail_file_name, \
            document_id, request_id, \
            seed, subseed, \
            cfg_scale, denoising_strength, \
            prompt, negative_prompt = splits
        return Automatic1111Result(
            timestamp=timestamp,
            image_file_name=image_file_name,
            thumbnail_file_name=thumbnail_file_name,
            document_id=document_id,
            request_id=request_id,
            seed=int(seed),
            subseed=int(subseed),
            cfg_scale=float(cfg_scale),
            denoising_strength=float(denoising_strength),
            prompt=prompt,
            negative_prompt=negative_prompt,
        )


class Automatic1111ResultGroupItem(BaseModel):
    image_file_name: str
    thumbnail_file_name: str
    seed: int
    subseed: int
    cfg_scale: float
    denoising_strength: Optional[float]


class Automatic1111ResultGroup(BaseModel):
    timestamp: str
    document_id: int
    request_id: str
    prompt: str
    negative_prompt: str
    group_items: List[Automatic1111ResultGroupItem]
