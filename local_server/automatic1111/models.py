from enum import Enum
from typing import Optional, List, Any

from pydantic import BaseModel


class MaskedContent(str, Enum):
    FILL = "fill"
    ORIGINAL = "original"
    LATENT_NOISE = "latent noise"
    LATENT_NOTHING = "latent nothing"


class SelectionArea(BaseModel):
    x: int
    y: int
    width: int
    height: int


class ImageSize(BaseModel):
    width: int
    height: int


class BaseAutomatic1111GenerateImageRequest(BaseModel):
    request_id: str
    document_id: int
    document_width: int
    document_height: int
    prompt: Optional[str]
    negative_prompt: Optional[str]
    image_count: int
    seed: int
    cfg_scale: Optional[float]
    sampling_method: str
    sampling_steps: int
    restore_faces: bool
    selection_area: Optional[SelectionArea]


class Automatic1111GenerateTxt2ImgRequest(BaseAutomatic1111GenerateImageRequest):
    pass


class Automatic1111GenerateImg2ImgRequest(BaseAutomatic1111GenerateImageRequest):
    denoising_strength: Optional[float]
    source_image_path: str
    source_image_x: int
    source_image_y: int


class Automatic1111GenerateInpaintRequest(Automatic1111GenerateImg2ImgRequest):
    mask_blur: int
    masked_content: MaskedContent
    mask_image_path: str
    mask_image_x: int
    mask_image_y: int


class GenerateImageRunConfiguration(BaseModel):
    num_images: int
    cfg_scale: float
    denoising_strength: Optional[float] = None


class Automatic1111BatchGenerateImageRequest(BaseModel):
    """
    :param request: txt2img part of the request to pick most of the settings from
    :param run_configurations: run configurations that were automatically determined server-side
    :param document_width: the Photoshop document width
    :param document_height: the Photoshop document height
    :param generate_image_width: the width of the image to generate. Not the same as requested selection area
    as this value is scaled (and potentially cropped) to what SD works best on
    :param generate_image_height: the height of the image to generate. Not the same as requested selection area
    :param scale_factor: by how much the generated image should be scaled to be pasted back to the selection area
    :param selection_area: area selected by the user (or full document if none selected)
    :param source_image_cropped_to_selection: (for img2img/inpaint) the cropped/scaled original image
    :param mask_image_cropped_to_selection: (for inpaint) the cropped/scaled mask
    :param mask_blur: (for inpaint) mask blur passed from the UI
    :param masked_content: (for inpaint) masked content passed from the UI
    """
    request: BaseAutomatic1111GenerateImageRequest
    run_configurations: List[GenerateImageRunConfiguration]
    document_width: int
    document_height: int
    generate_image_width: int
    generate_image_height: int
    scale_factor: float
    selection_area: SelectionArea
    source_image_cropped_to_selection: Optional[Any] = None
    mask_image_cropped_to_selection: Optional[Any] = None
    mask_blur: Optional[int] = None
    masked_content: Optional[MaskedContent] = None


class Automatic1111StatusResponse(BaseModel):
    is_reachable: bool


class Automatic1111CheckProgressResponse(BaseModel):
    is_processing: bool
    progress: Optional[float]


class Automatic1111SdModel(BaseModel):
    title: str
    model_name: str
    hash: Optional[str]
    sha256: Optional[str]
    is_active: bool = False


class Automatic1111GetModelsResponse(BaseModel):
    models: List[Automatic1111SdModel]


class Automatic1111Sampler(BaseModel):
    sampler_name: str


class Automatic1111GetSamplersResponse(BaseModel):
    samplers: List[Automatic1111Sampler]


class Automatic1111ChangeCurrentModelResponse(BaseModel):
    model_hash: str
