import React, {useContext, useEffect, useState} from "react";
import {AlertContext} from "../../../contexts/AlertContext";

const {RefreshIcon} = require("../../common/Icons.jsx");
const {localServerApi} = require("../../../api/localServerApi");
const {trueOrUndefined} = require("../../../utils/utils");

export const ModelsDropdown = ({ disabled, isLoadingModels, onIsLoadingModelsChange }) => {
  const [modelPlaceholder, setModelPlaceholder] = useState("")
  const [models, setModels] = useState([])
  const alertContext = useContext(AlertContext);

  const reloadModels = async () => {
    try {
      setModelPlaceholder("Pick a Stable Diffusion model")
      onIsLoadingModelsChange(true);
      const models = await localServerApi.getAvailableModels()
      setModels(models)
    } catch (e) {
      alertContext.setError(<>{e.message}</>)
    } finally {
      onIsLoadingModelsChange(false);
    }
  }

  const selectModel = (selectedModelHash) => {
    const updated_models = models.map(model => ({
      modelName: model.modelName,
      modelHash: model.modelHash,
      isModelActive: model.modelHash === selectedModelHash,
    }))
    setModels(updated_models)
  }

  const onChangeModel = async (event) => {
    try {
      const modelHash = event.target.value
      // Emptying the models will show the placeholder
      // This is kind of a hack; instead of that we could temporarily show another dropdown with the right
      // placeholder, but for some reason Photoshop seems to crash if we do that
      setModels([])
      setModelPlaceholder("Loading the model...")

      onIsLoadingModelsChange(true);
      await localServerApi.changeCurrentModel(modelHash)
      setModels(models)
      selectModel(modelHash)
    } catch (e) {
      alertContext.setError(<>{e.message}</>)
    } finally {
      onIsLoadingModelsChange(false);
    }
  }

  useEffect(() => {
    reloadModels();
  }, [])

  return (
    <>
      <div className="container flexRow">
        <sp-picker
          class="modelDropdown"
          placeholder={modelPlaceholder}
          disabled={trueOrUndefined(disabled || isLoadingModels)}
        >
          <sp-menu
            slot="options"
            onClick={onChangeModel}
          >
            {models.map(model => (
              <sp-menu-item
                key={`${model.modelName} [${model.modelHash}]`}
                value={model.modelHash}
                selected={trueOrUndefined(model.isModelActive)}
              >
                {model.modelName}
              </sp-menu-item>
            ))}
          </sp-menu>
        </sp-picker>
        <sp-action-button
          class="refreshButton"
          title="Refresh models"
          onClick={reloadModels}
          disabled={trueOrUndefined(disabled || isLoadingModels)}
        >
          <span slot="icon"><RefreshIcon /></span>
        </sp-action-button>
      </div>
    </>
  );
}
