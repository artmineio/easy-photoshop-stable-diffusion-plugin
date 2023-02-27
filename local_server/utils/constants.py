from pathlib import Path

OUTPUT_FOLDER_PATH = Path(__file__).parent.parent.parent.absolute() / 'dist' / 'output'

STORAGE_FOLDER_PATH = Path(__file__).parent.parent.absolute() / 'storage'

RESULTS_LOG_PATH = OUTPUT_FOLDER_PATH / 'generation_results.log'
PROMPTS_FILE_PATH = STORAGE_FOLDER_PATH / 'prompts.json'
SETTINGS_FILE_PATH = STORAGE_FOLDER_PATH / 'settings.json'

DEFAULT_AUTOMATIC1111_URL = "http://127.0.0.1:7860"

THUMBNAIL_IMAGE_WIDTH = 200
