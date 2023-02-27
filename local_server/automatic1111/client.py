import json
import re
import traceback
from typing import List, Optional, Dict

import requests
from pydantic import BaseModel

from automatic1111.models import Automatic1111SdModel, Automatic1111Sampler
from settings.settings_service import settings_service
from utils.exceptions import bad_request

IMG2IMG_PATH = "/sdapi/v1/img2img"
TXT2IMG_PATH = "/sdapi/v1/txt2img"
PROGRESS_PATH = "/sdapi/v1/progress?skip_current_image=false"
SD_MODELS_PATH = "/sdapi/v1/sd-models"
OPTIONS_PATH = "/sdapi/v1/options"
SAMPLERS_PATH = "/sdapi/v1/samplers"
INTERRUPT_PATH = "/sdapi/v1/interrupt"


MASKED_CONTENT_OPTIONS = ['fill', 'original', 'latent noise', 'latent nothing']
GRADIO_UI_CONFIG_REGEX = r"<script>window.gradio.config = (.*);</script>"
GRADIO_UI_MODELS_DROPDOWN_ID = 922
GRADIO_UI_MODEL_NAME_WITH_HASH_REGEX = r".*\[(\w+)\]$"
GRADIO_UI_RUN_PREDICT_PATH = "/run/predict"
GRADIO_UI_RUN_PREDICT_FN_INDEX = 206


class Automatic1111ClientGenerateImageRequest(BaseModel):
    init_images_base64: List[str]
    mask_base64: Optional[str]
    width: int
    height: int
    prompt: str
    n_iter: int
    negative_prompt: str
    cfg_scale: float
    seed: int
    sampler_index: str
    steps: int
    restore_faces: bool
    denoising_strength: Optional[float]
    mask_blur: Optional[int]
    masked_content: Optional[str]


class Automatic1111ClientGenerateImageResponse(BaseModel):
    images_base64: List[str]
    all_seeds: List[int]
    all_subseeds: List[int]
    subseed_strength: float
    cfg_scale: float
    denoising_strength: Optional[float]
    sd_model_hash: str
    sampler_name: str
    steps: int


class Automatic1111ClientCheckProgressResponse(BaseModel):
    progress: float
    has_finished: bool


class Automatic1111Client:
    @staticmethod
    def _get_base_automatic1111_url():
        settings = settings_service.get_settings()
        return settings.automatic1111_url

    def _get_generate_image_automatic1111_url(self, has_init_images: bool):
        base_url = self._get_base_automatic1111_url()
        if has_init_images:
            return f"{base_url}{IMG2IMG_PATH}"
        return f"{base_url}{TXT2IMG_PATH}"

    def _bad_connection_error(self):
        # TODO: find a better way to convert ConnectionError to something Frontend understands
        return bad_request(f"Automatic1111 connection error at {self._get_base_automatic1111_url()}")

    @staticmethod
    def _get_inpainting_fill(masked_content: str):
        if masked_content not in MASKED_CONTENT_OPTIONS:
            raise bad_request(f"Invalid masked content '{masked_content}'")
        # inpainting_fill is the index of the option in the "Masked content" radio button group
        return MASKED_CONTENT_OPTIONS.index(masked_content)

    def is_reachable(self):
        try:
            requests.get(self._get_base_automatic1111_url())
            return True
        except requests.exceptions.ConnectionError:
            return False

    def get_sd_models(self) -> List[Automatic1111SdModel]:
        try:
            raw_response = requests.get(f"{self._get_base_automatic1111_url()}{SD_MODELS_PATH}")
            response = raw_response.json()
            print('Models response', response)
            models = list(map(
                lambda response_sampler: Automatic1111SdModel(
                    title=response_sampler["title"],
                    model_name=response_sampler["model_name"],
                    hash=response_sampler["hash"],
                    sha256=response_sampler["sha256"],
                ),
                response
            ))
            try:
                current_model_hash = self._get_default_sd_model_hash_via_predict()
                print(f"Current model hash: {current_model_hash}")
            except Exception as e:
                print(f"Could not determine current model hash")
                traceback.print_exc()

            if current_model_hash:
                current_model = next((model for model in models if model.hash == current_model_hash), None)
                if current_model is not None:
                    current_model.is_active = True
            return models
        except requests.exceptions.ConnectionError:
            raise self._bad_connection_error()

    def _get_default_sd_model_hash_via_predict(self) -> Optional[str]:
        try:
            response = requests.post(
                f"{self._get_base_automatic1111_url()}{GRADIO_UI_RUN_PREDICT_PATH}",
                json={"fn_index": GRADIO_UI_RUN_PREDICT_FN_INDEX, "data": []}
            ).json()
            data_items = response.get("data", [])
            model_dropdown_item = next((item for item in data_items if type(item.get("value", None)) == str and
                                        re.search(GRADIO_UI_MODEL_NAME_WITH_HASH_REGEX, item.get("value", None))), {})
            model_name_and_hash = model_dropdown_item.get("value", None)
            if model_dropdown_item is None:
                print("Could not find the current model dropdown from Automatic1111 UI")
                return None

            model_hash_search = re.search(GRADIO_UI_MODEL_NAME_WITH_HASH_REGEX, model_name_and_hash)
            if model_hash_search is None or len(model_hash_search.groups()) <= 0:
                print("Could not determine the model hash from the dropdown value in Automatic1111 UI")
                return None
            return model_hash_search.group(1)
        except requests.exceptions.ConnectionError:
            raise self._bad_connection_error()

    def get_samplers(self) -> List[Automatic1111Sampler]:
        try:
            response = requests.get(f"{self._get_base_automatic1111_url()}{SAMPLERS_PATH}").json()
            return list(map(
                lambda response_sampler: Automatic1111Sampler(
                    sampler_name=response_sampler["name"],
                ),
                response
            ))
        except requests.exceptions.ConnectionError:
            raise self._bad_connection_error()

    def get_default_sd_model_hash_via_html(self) -> Optional[str]:
        try:
            # This method doesn't seem reliable as we need to rely on predict
            # TODO: find current model hash via API when it's available
            automatic1111_html = requests.get(self._get_base_automatic1111_url()).text
            config_regex_search = re.search(GRADIO_UI_CONFIG_REGEX, automatic1111_html)
            if config_regex_search is None or len(config_regex_search.groups()) <= 0:
                print("Could not determine the current SD model from Automatic1111 UI")
                return None

            try:
                gradio_config_dict = json.loads(config_regex_search.group(1))
            except json.decoder.JSONDecodeError as e:
                print("Could not parse the current SD model from Automatic1111 UI")
                return None

            components = gradio_config_dict.get("components", [])
            models_dropdown_config = next((item for item in components if item.get("id", None) ==
                                           GRADIO_UI_MODELS_DROPDOWN_ID), {})

            model_name_and_hash = models_dropdown_config.get("props", {}).get("value", None)
            if not model_name_and_hash:
                print("Could not find the current SD model in config of Automatic1111 UI")
                return None

            model_hash_search = re.search(GRADIO_UI_MODEL_NAME_WITH_HASH_REGEX, model_name_and_hash)
            if model_hash_search is None or len(model_hash_search.groups()) <= 0:
                print("Could not determine the model hash from the dropdown value in Automatic1111 UI")
                return None
            return model_hash_search.group(1)
        except requests.exceptions.ConnectionError:
            raise self._bad_connection_error()

    def change_current_sd_model(self, model_hash):
        try:
            request = {
                "sd_model_checkpoint": model_hash,
            }
            requests.post(
                f"{self._get_base_automatic1111_url()}{OPTIONS_PATH}",
                json=request
            )
        except requests.exceptions.ConnectionError:
            raise self._bad_connection_error()

    def check_progress(self) -> float:
        try:
            raw_response = requests.get(f"{self._get_base_automatic1111_url()}{PROGRESS_PATH}")
            response = raw_response.json()
            print(f"Automatic111 progress: {response['progress']}")
            return response['progress']
        except requests.exceptions.ConnectionError:
            raise self._bad_connection_error()

    def interrupt_progress(self) -> float:
        try:
            requests.post(f"{self._get_base_automatic1111_url()}{INTERRUPT_PATH}")
        except requests.exceptions.ConnectionError:
            raise self._bad_connection_error()

    def generate_image(self, request: Automatic1111ClientGenerateImageRequest) -> Automatic1111ClientGenerateImageResponse:
        try:
            inpainting_fill = self._get_inpainting_fill(request.masked_content) if request.masked_content is not None else None
            has_init_images = True if len(request.init_images_base64) else False
            client_request = {
                "init_images": request.init_images_base64 or None,
                "mask": request.mask_base64,
                "width": request.width,
                "height": request.height,
                "prompt": request.prompt,
                "negative_prompt": request.negative_prompt,
                "cfg_scale": request.cfg_scale,
                "n_iter": request.n_iter,
                "seed": request.seed,
                "sampler_index": request.sampler_index,
                "steps": request.steps,
                "restore_faces": request.restore_faces,
                "denoising_strength": request.denoising_strength,
                "inpainting_fill": inpainting_fill,
                "mask_blur": request.mask_blur,
                # Other default values that we don't expose
                "subseed": -1,
                "subseed_strength": 0,
                "batch_size": 1,
                "resize_mode": 0,  # Corresponds to "Just resize" option in "Resize mode" radio button group
                "inpaint_full_res": False,
                "inpaint_full_res_padding": 0,
                "inpainting_mask_invert": 0,
                "styles": [],
                "seed_resize_from_h": -1,
                "seed_resize_from_w": -1,
                "tiling": False,
                "eta": 0,
                "s_churn": 0,
                "s_tmax": 0,
                "s_tmin": 0,
                "s_noise": 1,
                "override_settings": {},
                "include_init_images": False,
            }
            url = self._get_generate_image_automatic1111_url(has_init_images=has_init_images)
            print(f"Making request to {url}", self._request_without_images(client_request))
            raw_response = requests.post(
                url,
                json=self._request_without_none_values(client_request),
            )
            response = raw_response.json()
            print(f"Got response from {url}", self._response_without_images(response))
            response_info = json.loads(response["info"])
            return Automatic1111ClientGenerateImageResponse(
                images_base64=response["images"],
                all_seeds=response_info["all_seeds"],
                all_subseeds=response_info["all_subseeds"],
                subseed_strength=response_info["subseed_strength"],
                cfg_scale=response_info["cfg_scale"],
                denoising_strength=response_info["denoising_strength"],
                sd_model_hash=response_info["sd_model_hash"],
                sampler_name=response_info["sampler_name"],
                steps=response_info["steps"],
            )
        except requests.exceptions.ConnectionError:
            raise self._bad_connection_error()

    @staticmethod
    def _request_without_none_values(dic: Dict) -> Dict:
        return {k: v for k, v in dic.items() if v is not None}

    @staticmethod
    def _request_without_images(dic: Dict) -> Dict:
        return {k: v for k, v in dic.items() if k not in ['init_images', 'mask']}

    @staticmethod
    def _response_without_images(dic: Dict) -> Dict:
        return {k: v for k, v in dic.items() if k not in ['images']}


automatic1111_client = Automatic1111Client()
