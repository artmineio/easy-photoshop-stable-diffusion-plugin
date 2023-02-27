export const InferenceType = Object.freeze({
  TXT_2_IMG: "txt2img",
  IMG_2_IMG: "img2img",
  INPAINT: "inpaint",
});

export const STATIC_FILES_URL = "http://localhost:8088/static"

export const PAINTBRUSH_TOOL = "paintbrushTool";
export const ERASER_TOOL = "eraserTool";

export const DEFAULT_CFG_SCALE = 7;

export const DEFAULT_DENOISING_STRENGTH = 0.75;

export const DEFAULT_MAIN_PANEL_SETTINGS = {
  seed: -1,
  cfgScale: null,
  denoisingStrength: null,
}

const DEFAULT_STABLE_DIFFUSION_SETTINGS = {
  inferenceType: InferenceType.TXT_2_IMG,
  prompt: "",
  negativePrompt: "",
  imageCount: 4,
  samplingMethod: "Euler a",
  samplingSteps: 20,
  maskBlur: 12,
  maskedContent: "original",
  restoreFaces: false,
}

const DEFAULT_UI_SETTINGS = {
  isAdvancedOptionsExpanded: false,
  showTxt2ImgInstructions: true,
  showImg2ImgInstructions: true,
  showInpaintInstructions: true,
}

export const DEFAULT_DREAM_TAB_SETTINGS = {
  ...DEFAULT_STABLE_DIFFUSION_SETTINGS,
  ...DEFAULT_UI_SETTINGS,
}

export const BACKEND_SETTING_NAMES = {
  AUTOMATIC1111_URL: "automatic1111_url",
  OUTPUT_FOLDER: "output_folder",
}
