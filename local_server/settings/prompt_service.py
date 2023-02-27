import json
from typing import Dict

from utils.constants import PROMPTS_FILE_PATH

DEFAULT_PROMPTS = {
  "cartoonish": "(drawn), cartoon, (animation:0.5)",
  "artistic": "(art), painted, picture",
  "realistic": "real-life, (realistic), photo",
}


class PromptService:
    def expand_stored_prompts(self, prompt: str) -> Dict:
        stored_prompts = self.get_stored_prompts()
        expanded_prompt = prompt
        for k, v in stored_prompts.items():
            expanded_prompt = expanded_prompt.replace("{" + k + "}", v)
        return expanded_prompt

    def store_prompt(self, prompt_key: str, prompt: str) -> Dict:
        stored_prompts = self.get_stored_prompts()
        stored_prompts[prompt_key] = prompt
        self.set_stored_prompts(stored_prompts)

    @staticmethod
    def set_stored_prompts(prompts: str):
        with open(PROMPTS_FILE_PATH, 'w') as f:
            json.dump(prompts, f, indent=2)

    @staticmethod
    def get_stored_prompts() -> Dict:
        try:
            with open(PROMPTS_FILE_PATH) as f:
                return json.load(f)
        except FileNotFoundError:
            # This can happen before any prompts are saved
            return DEFAULT_PROMPTS


prompt_service = PromptService()
