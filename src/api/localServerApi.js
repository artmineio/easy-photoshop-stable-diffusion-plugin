const {NetworkError} = require("../exceptions/Exceptions");
const {ajaxClient} = require("./ajaxClient");

class LocalServerApi {

  isLocalServerAndAutomatic1111Reachable = async () => {
    try {
      // Check that the server and Automatic1111 server are reachable
      const isAutomatic1111Reachable = await this.isAutomatic1111Reachable()
      return {
        isLocalServerReachable: true,
        isAutomatic1111Reachable,
      };
    } catch (e) {
      if (e instanceof NetworkError) {
        return {
          isLocalServerReachable: false,
        };
      }
      console.log("Unknown error trying to reach server. This shouldn't happen")
      return {
        isLocalServerReachable: false,
      };
    }
  }

  isAutomatic1111Reachable = async () => {
    return (await ajaxClient.get("/sd/automatic1111/status"))["is_reachable"]
  }

  getSettings = async () => {
    return (await ajaxClient.get("/settings/general"))["settings"]
  }

  updateSetting = async (settingName, settingValue) => {
    await ajaxClient.post(
      "/settings/general",
      {
        setting_name: settingName,
        setting_value: settingValue,
      },
    )
  }

  getSamplers = async () => {
    return (await ajaxClient.get(
      "/sd/automatic1111/samplers",
    ))["samplers"]
      .map(({sampler_name}) => ({samplerName: sampler_name}))
  }

  getAvailableModels = async () => {
    return (await ajaxClient.get(
      "/sd/automatic1111/models",
    ))["models"]
      .map(({title, hash, is_active}) => ({modelName: title, modelHash: hash, isModelActive: is_active}))
  }

  changeCurrentModel = async (modelHash) => {
    await ajaxClient.post(
      "/sd/automatic1111/models/current",
      {model_hash: modelHash},
    )
  }

  enqueueTxt2ImgRequest = async (request) => {
    await ajaxClient.post(
      "/sd/automatic1111/generate/txt2img",
      request,
    )
  }

  enqueueImg2ImgRequest = async (request) => {
    await ajaxClient.post(
      "/sd/automatic1111/generate/img2img",
      request,
    )
  }

  enqueueInpaintRequest = async (request) => {
    await ajaxClient.post(
      "/sd/automatic1111/generate/inpaint",
      request,
    )
  }

  processEnqueuedRequest = async () => {
    await ajaxClient.post(
      "/sd/automatic1111/generate/process",
    )
  }

  getProgress = async () => {
    return (await ajaxClient.post(
      "/sd/automatic1111/progress",
    ))
  }

  stopProcessing = async () => {
    await ajaxClient.post(
      "/sd/automatic1111/generate/stop",
    )
  }

  getAllResults = async () => {
    return (await ajaxClient.post(
      "/results/get-all",
    ))["result_groups"]
  }

  getStoredPrompts = async () => {
    return (await ajaxClient.get(
      "/settings/prompts",
    ))["prompts"]
  }

  setStoredPrompts = async (prompts) => {
    await ajaxClient.put(
      "/settings/prompts",
      {
        prompts,
      }
    )
  }
}

export const localServerApi = new LocalServerApi();
