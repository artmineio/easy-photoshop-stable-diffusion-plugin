from __future__ import annotations

import json
import re
from enum import Enum
from pathlib import Path
from typing import Dict, List

import requests
from pydantic import BaseModel

from utils.constants import SETTINGS_FILE_PATH, OUTPUT_FOLDER_PATH, DEFAULT_AUTOMATIC1111_URL
from utils.exceptions import bad_request


class SettingName(str, Enum):
    AUTOMATIC1111_URL = "automatic1111_url"
    # Need to expose output folder to the UI for loading generated images in Photoshop
    OUTPUT_FOLDER = "output_folder"

    @classmethod
    def name_exists(cls, setting_name):
        return setting_name in cls._value2member_map_


READ_ONLY_SETTINGS: List[str] = [SettingName.OUTPUT_FOLDER.value]

DEFAULT_SETTINGS = {
    SettingName.AUTOMATIC1111_URL.value: DEFAULT_AUTOMATIC1111_URL,
    SettingName.OUTPUT_FOLDER.value: str(OUTPUT_FOLDER_PATH),
}


class PluginSettings(BaseModel):
    automatic1111_url: str
    output_folder: str

    def to_dict(self) -> dict:
        return {
            "automatic1111_url": self.automatic1111_url,
            "output_folder": self.output_folder,
        }

    @staticmethod
    def from_dict_or_default(dic: Dict) -> PluginSettings:
        return PluginSettings(
            automatic1111_url=dic.get("automatic1111_url") or DEFAULT_SETTINGS["automatic1111_url"],
            output_folder=dic.get("output_folder") or DEFAULT_SETTINGS["output_folder"],
        )


# def set_output_folder(output_folder_path):
#     Path(output_folder_path).mkdir(exist_ok=True, parents=True)


def test_automatic1111_url(url):
    try:
        requests.get(url)
    except requests.exceptions.ConnectionError:
        raise bad_request(f"Cannot connect to {url}")


class SettingsService:
    def set_setting(self, setting_name: str, setting_value: str):
        if not SettingName.name_exists(setting_name):
            raise bad_request(f"Unrecognized setting {setting_name}")
        if setting_name in READ_ONLY_SETTINGS:
            raise bad_request(f"Cannot change read-only setting {setting_name}")

        # if setting_name == SettingName.OUTPUT_FOLDER.value:
        #     # We don't expect a forward/backward slash at the end
        #     setting_value = re.sub(r'/$', '', setting_value)
        #     setting_value = re.sub(r'\\$', '', setting_value)
        #     set_output_folder(setting_value)

        if setting_name == SettingName.AUTOMATIC1111_URL.value:
            # automatic1111 client expects to slash at the end
            setting_value = re.sub(r'/$', '', setting_value)
            test_automatic1111_url(setting_value)

        settings = self.get_settings()
        settings_dict = settings.to_dict()
        settings_dict[setting_name] = setting_value
        with open(SETTINGS_FILE_PATH, 'w') as f:
            json.dump(settings_dict, f, indent=2)

    @staticmethod
    def get_settings() -> PluginSettings:
        try:
            with open(SETTINGS_FILE_PATH) as f:
                return PluginSettings.from_dict_or_default(json.load(f))
        except FileNotFoundError:
            # This can happen before any prompts are saved
            return PluginSettings.from_dict_or_default({})


settings_service = SettingsService()
