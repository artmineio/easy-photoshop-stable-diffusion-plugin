from __future__ import annotations

import threading
import traceback
from typing import Optional, List

import cv2
import numpy as np

from automatic1111.client import automatic1111_client, Automatic1111ClientGenerateImageRequest
from automatic1111.models import MaskedContent, BaseAutomatic1111GenerateImageRequest, SelectionArea, \
    GenerateImageRunConfiguration, Automatic1111BatchGenerateImageRequest, Automatic1111CheckProgressResponse
from automatic1111.results import Automatic1111Result
from settings.prompt_service import prompt_service
from utils.constants import OUTPUT_FOLDER_PATH, RESULTS_LOG_PATH
from utils.exceptions import bad_request
from utils.image_utils import cv2_image_to_base64_string, \
    base64_string_to_cv2_image, \
    paste_image_onto_selection_in_new_image, get_image_thumbnail
from utils.time_utils import current_time_as_string


class ImageGenerationService:

    def __init__(self):
        self.processing_request_lock = threading.Lock()
        self.enqueue_request_lock = threading.Lock()
        self.enqueued_request = None
        self.processing_request = None
        self.processed_requests_count = 0
        self.total_requests_count = 0

    def check_progress(self) -> Automatic1111CheckProgressResponse:
        if self.enqueued_request is None:
            return Automatic1111CheckProgressResponse(
                is_processing=False,
                progress=None,
            )

        if self.total_requests_count == 0:
            # Nothing is processed yet
            return Automatic1111CheckProgressResponse(
                is_processing=True,
                progress=0,
            )

        progress = automatic1111_client.check_progress()
        # Automatic1111 only tells us the progress for one request, in case of a batch call we need to take into
        # account how many requests we have already processed
        progress = min((self.processed_requests_count + progress) / self.total_requests_count, 1)
        return Automatic1111CheckProgressResponse(
            is_processing=True,
            progress=progress,
        )

    def stop_image_generation(self):
        with self.enqueue_request_lock:
            if self.enqueued_request is None:
                print("No enqueued request, nothing to stop")
                return
            self.enqueued_request = None
        # Stop whatever is in flight in Automatic1111
        automatic1111_client.interrupt_progress()

    def enqueue_batch_generate_images_request(self, request: Automatic1111BatchGenerateImageRequest):
        # Automatic1111 API only processes one request, so when enqueue_request_lock is not none, it means that
        # backed is already processing some request
        with self.enqueue_request_lock:
            if self.enqueued_request is not None:
                raise bad_request("Already started processing images, please wait or cancel")
            self.enqueued_request = request

    def process_enqueued_generate_images_request(self):
        enqueued_request = self.enqueued_request
        if enqueued_request is None:
            raise bad_request("Image processing is stopped, please try again")

        # Second lock makes sure that two threads don't try to process the same request in case of two
        # consecutive requests
        with self.processing_request_lock:
            if self.processing_request is not None:
                raise bad_request("Already processing images, please wait or cancel")
            self.processing_request = enqueued_request

        try:
            self._batched_generate_images_internal(
                request=enqueued_request.request,
                run_configurations=enqueued_request.run_configurations,
                document_width=enqueued_request.document_width,
                document_height=enqueued_request.document_height,
                generate_image_width=enqueued_request.generate_image_width,
                generate_image_height=enqueued_request.generate_image_height,
                scale_factor=enqueued_request.scale_factor,
                selection_area=enqueued_request.selection_area,
                source_image_cropped_to_selection=enqueued_request.source_image_cropped_to_selection,
                mask_image_cropped_to_selection=enqueued_request.mask_image_cropped_to_selection,
                mask_blur=enqueued_request.mask_blur,
                masked_content=enqueued_request.masked_content,
            )
        except:
            print(f"Error generating images for request: {enqueued_request.request.request_id}")
            traceback.print_exc()
        finally:
            self.processing_request = None
            self.enqueued_request = None
            print(f"Finished generating images for request: {enqueued_request.request.request_id}")

    def _batched_generate_images_internal(
            self,
            request: BaseAutomatic1111GenerateImageRequest,
            run_configurations: List[GenerateImageRunConfiguration],
            document_width: int,
            document_height: int,
            generate_image_width: int,
            generate_image_height: int,
            scale_factor: float,
            selection_area: SelectionArea,
            source_image_cropped_to_selection: Optional[np.ndarray] = None,
            mask_image_cropped_to_selection: Optional[np.ndarray] = None,
            mask_blur: Optional[int] = None,
            masked_content: Optional[MaskedContent] = None,
    ):
        print(f"Starting generating images for request: {request.request_id}")
        self.total_requests_count = len(run_configurations)

        if source_image_cropped_to_selection is not None:
            init_images_base64 = [cv2_image_to_base64_string(source_image_cropped_to_selection)]
        else:
            init_images_base64 = []

        if mask_image_cropped_to_selection is not None:
            mask_base64 = cv2_image_to_base64_string(mask_image_cropped_to_selection)
        else:
            mask_base64 = None

        expanded_prompt = prompt_service.expand_stored_prompts(request.prompt)
        expanded_negative_prompt = prompt_service.expand_stored_prompts(request.negative_prompt)
        request_time_string = current_time_as_string()
        generated_image_index = 0

        self.processed_requests_count = 0
        for run_configuration in run_configurations:
            if self.enqueued_request is None:
                print(f"Interrupted generating images for request: {request.request_id}")
                return

            response = automatic1111_client.generate_image(Automatic1111ClientGenerateImageRequest(
                init_images_base64=init_images_base64,
                mask_base64=mask_base64,
                width=generate_image_width,
                height=generate_image_height,
                prompt=expanded_prompt,
                negative_prompt=expanded_negative_prompt,
                n_iter=run_configuration.num_images,
                cfg_scale=run_configuration.cfg_scale,
                seed=request.seed,
                sampler_index=request.sampling_method,
                steps=request.sampling_steps,
                restore_faces=request.restore_faces,
                denoising_strength=run_configuration.denoising_strength,
                mask_blur=mask_blur,
                masked_content=masked_content,
            ))

            for image_base64, seed, subseed in zip(response.images_base64, response.all_seeds, response.all_subseeds):
                generated_image = base64_string_to_cv2_image(image_base64)
                # Paste images to the user selected area in the otherwise transparent RGBA png image
                generated_pasted_image = paste_image_onto_selection_in_new_image(
                    document_width=document_width,
                    document_height=document_height,
                    image_to_paste=generated_image,
                    selection_area=selection_area,
                    scale_factor=scale_factor,
                )
                base_file_name = f"{request.document_id}-{request.request_id}-{request_time_string}-{generated_image_index}"
                generated_image_index += 1

                image_file_name = f"img_{base_file_name}.png"
                cv2.imwrite(str(OUTPUT_FOLDER_PATH / image_file_name), generated_pasted_image)

                thumbnail_file_name = f"thumb_{base_file_name}.jpg"
                thumbnail_image = get_image_thumbnail(generated_image)
                cv2.imwrite(str(OUTPUT_FOLDER_PATH / thumbnail_file_name), thumbnail_image)

                response_log_line = Automatic1111Result(
                    timestamp=request_time_string,
                    image_file_name=image_file_name,
                    thumbnail_file_name=thumbnail_file_name,
                    document_id=request.document_id,
                    request_id=request.request_id,
                    seed=seed,
                    subseed=subseed,
                    cfg_scale=response.cfg_scale,
                    denoising_strength=response.denoising_strength,
                    prompt=request.prompt,  # Use original prompt without substitutions
                    negative_prompt=request.negative_prompt,  # Use original prompt without substitutions
                )
                with open(RESULTS_LOG_PATH, "a") as response_log_file:
                    response_log_file.write(response_log_line.to_log_line())
            self.processed_requests_count += 1

        # We don't need to reset these values as each request rests them before starting
        # self.total_requests_count = 0
        # self.processed_requests_count = 0


image_generation_service = ImageGenerationService()
