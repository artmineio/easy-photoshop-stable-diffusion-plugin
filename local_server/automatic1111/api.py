from __future__ import annotations

from typing import Optional

import cv2
from fastapi import APIRouter

from automatic1111.client import automatic1111_client
from automatic1111.image_generation_service import image_generation_service
from automatic1111.models import Automatic1111CheckProgressResponse, Automatic1111GenerateTxt2ImgRequest, \
    Automatic1111GenerateImg2ImgRequest, Automatic1111GenerateInpaintRequest, Automatic1111GetModelsResponse, \
    SelectionArea, Automatic1111ChangeCurrentModelResponse, \
    Automatic1111GetSamplersResponse, Automatic1111BatchGenerateImageRequest, Automatic1111StatusResponse
from automatic1111.run_configuration_provider import run_configuration_provider
from utils.constants import OUTPUT_FOLDER_PATH
from utils.image_utils import extract_image_from_selection_and_scale, convert_mask_image, get_scale_factor, \
    read_image_as_full_sized_layer, adjust_selection_area

router = APIRouter()


@router.get("/sd/automatic1111/status")
def get_status() -> Automatic1111StatusResponse:
    is_reachable = automatic1111_client.is_reachable()
    return Automatic1111StatusResponse(
        is_reachable=is_reachable,
    )


@router.post("/sd/automatic1111/progress")
def check_progress() -> Automatic1111CheckProgressResponse:
    return image_generation_service.check_progress()


@router.get("/sd/automatic1111/models")
def get_models() -> Automatic1111GetModelsResponse:
    models = automatic1111_client.get_sd_models()
    return Automatic1111GetModelsResponse(
        models=models,
    )


@router.post("/sd/automatic1111/models/current")
def change_model(request: Automatic1111ChangeCurrentModelResponse):
    automatic1111_client.change_current_sd_model(request.model_hash)


@router.get("/sd/automatic1111/samplers")
def get_samplers() -> Automatic1111GetSamplersResponse:
    samplers = automatic1111_client.get_samplers()
    return Automatic1111GetSamplersResponse(
        samplers=samplers,
    )


@router.post("/sd/automatic1111/generate/stop")
def stop_generation():
    # Since image generation is a blocking request, making this call should stop that request asap and make it
    # return to front-end
    image_generation_service.stop_image_generation()


@router.post("/sd/automatic1111/generate/process")
def process_enqueued_request():
    """
    This will start generating images based on the enqueued request
    """
    image_generation_service.process_enqueued_generate_images_request()


@router.post("/sd/automatic1111/generate/txt2img")
def generate_txt2img(request: Automatic1111GenerateTxt2ImgRequest):
    document_width = request.document_width
    document_height = request.document_height

    selection_area = adjust_selection_area(
        user_input_selection_area=request.selection_area,
        source_image_area=None,
        mask_image_area=None,
        document_width=document_width,
        document_height=document_height,
    )

    scaled_width, scaled_height, scale_factor = get_scale_factor(selection_area)

    run_configurations = run_configuration_provider.build_txt2img_run_configurations(
        image_count=request.image_count,
        requested_cfg_scale=request.cfg_scale,
    )

    # We are only enqueuing request so that backend can track the current progress as busy
    # Another request would kick off the generation process
    image_generation_service.enqueue_batch_generate_images_request(
        Automatic1111BatchGenerateImageRequest(
            request=request,
            run_configurations=run_configurations,
            document_width=document_width,
            document_height=document_height,
            generate_image_width=scaled_width,
            generate_image_height=scaled_height,
            scale_factor=scale_factor,
            selection_area=selection_area,
        )
    )


@router.post("/sd/automatic1111/generate/img2img")
def generate_img2img(request: Automatic1111GenerateImg2ImgRequest):
    document_width = request.document_width
    document_height = request.document_height

    source_image, source_image_area = read_image_as_full_sized_layer(
        document_width=document_width,
        document_height=document_height,
        image_file_path=request.source_image_path,
        image_x=request.source_image_x,
        image_y=request.source_image_y,
        layer_description='picked source layer',
    )
    # cv2.imwrite(str(OUTPUT_FOLDER_PATH / f"debug_{request.request_id}_source_input.png"), source_image)

    selection_area = adjust_selection_area(
        user_input_selection_area=request.selection_area,
        source_image_area=source_image_area,
        mask_image_area=None,
        document_width=document_width,
        document_height=document_height,
    )

    source_image_cropped_scaled, scale_factor = extract_image_from_selection_and_scale(source_image, selection_area)
    # cv2.imwrite(str(OUTPUT_FOLDER_PATH / f"debug_{request.request_id}_source_cropped_scaled.png"), source_image_cropped_scaled)

    run_configurations = run_configuration_provider.build_img2img_run_configurations(
        image_count=request.image_count,
        requested_cfg_scale=request.cfg_scale,
        requested_denoising_strength=request.denoising_strength,
    )

    image_generation_service.enqueue_batch_generate_images_request(
        Automatic1111BatchGenerateImageRequest(
            request=request,
            run_configurations=run_configurations,
            document_width=document_width,
            document_height=document_height,
            generate_image_width=source_image_cropped_scaled.shape[1],
            generate_image_height=source_image_cropped_scaled.shape[0],
            selection_area=selection_area,
            scale_factor=scale_factor,
            source_image_cropped_to_selection=source_image_cropped_scaled,
        )
    )


@router.post("/sd/automatic1111/generate/inpaint")
def generate_inpaint(request: Automatic1111GenerateInpaintRequest):
    document_width = request.document_width
    document_height = request.document_height

    source_image, source_image_area = read_image_as_full_sized_layer(
        document_width=document_width,
        document_height=document_height,
        image_file_path=request.source_image_path,
        image_x=request.source_image_x,
        image_y=request.source_image_y,
        layer_description='picked source layer',
    )
    # cv2.imwrite(str(OUTPUT_FOLDER_PATH / f"debug_{request.request_id}_source_input.png"), source_image)

    user_input_mask_image, mask_image_area = read_image_as_full_sized_layer(
        document_width=document_width,
        document_height=document_height,
        image_file_path=request.mask_image_path,
        image_x=request.mask_image_x,
        image_y=request.mask_image_y,
        layer_description='mask layer',
    )
    # cv2.imwrite(str(OUTPUT_FOLDER_PATH / f"debug_{request.request_id}_mask_input.png"), user_input_mask_image)

    selection_area = adjust_selection_area(
        user_input_selection_area=request.selection_area,
        source_image_area=source_image_area,
        mask_image_area=mask_image_area,
        document_width=document_width,
        document_height=document_height,
    )

    source_image_cropped_scaled, scale_factor = extract_image_from_selection_and_scale(source_image, selection_area)
    # cv2.imwrite(str(OUTPUT_FOLDER_PATH / f"debug_{request.request_id}_source_cropped_scaled.png"), source_image_cropped_scaled)

    mask_image_cropped_scaled, _ = extract_image_from_selection_and_scale(user_input_mask_image, selection_area)
    mask_image_cropped_scaled_converted = convert_mask_image(mask_image_cropped_scaled)
    # cv2.imwrite(str(OUTPUT_FOLDER_PATH / f"debug_{request.request_id}_mask_cropped_scaled.png"), mask_image_cropped_scaled_converted)

    run_configurations = run_configuration_provider.build_img2img_run_configurations(
        image_count=request.image_count,
        requested_cfg_scale=request.cfg_scale,
        requested_denoising_strength=request.denoising_strength,
    )

    image_generation_service.enqueue_batch_generate_images_request(
        Automatic1111BatchGenerateImageRequest(
            request=request,
            run_configurations=run_configurations,
            document_width=document_width,
            document_height=document_height,
            generate_image_width=source_image_cropped_scaled.shape[1],
            generate_image_height=source_image_cropped_scaled.shape[0],
            selection_area=selection_area,
            scale_factor=scale_factor,
            source_image_cropped_to_selection=source_image_cropped_scaled,
            mask_image_cropped_to_selection=mask_image_cropped_scaled_converted,
            mask_blur=request.mask_blur,
            masked_content=request.masked_content,
        )
    )
