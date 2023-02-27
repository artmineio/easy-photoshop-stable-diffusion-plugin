from __future__ import annotations

from typing import Dict

from fastapi import APIRouter
from pydantic import BaseModel

from settings.prompt_service import prompt_service
from settings.settings_service import PluginSettings, settings_service

router = APIRouter()


class GetSettingsResponse(BaseModel):
    settings: PluginSettings


class UpdateSettingRequest(BaseModel):
    setting_name: str
    setting_value: str


@router.get("/settings/general")
def get_results() -> GetSettingsResponse:
    settings = settings_service.get_settings()
    return GetSettingsResponse(
        settings=settings,
    )


@router.post("/settings/general")
def update_setting(request: UpdateSettingRequest):
    settings_service.set_setting(
        setting_name=request.setting_name,
        setting_value=request.setting_value,
    )


class GetStoredPromptsResponse(BaseModel):
    prompts: Dict


class AddStoredPromptRequest(BaseModel):
    prompt_key: str
    prompt: str


class SetStoredPromptRequest(BaseModel):
    prompts: Dict


@router.get("/settings/prompts")
def get_stored_prompts() -> GetStoredPromptsResponse:
    prompts = prompt_service.get_stored_prompts()
    return GetStoredPromptsResponse(prompts=prompts)


@router.post("/settings/prompts")
def add_stored_prompt(request: AddStoredPromptRequest):
    prompt_service.store_prompt(prompt_key=request.prompt_key, prompt=request.prompt)


@router.put("/settings/prompts")
def set_stored_prompts(request: SetStoredPromptRequest):
    prompt_service.set_stored_prompts(prompts=request.prompts)
