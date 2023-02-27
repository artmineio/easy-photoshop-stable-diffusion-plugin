import React, {useContext} from "react";
import {ERASER_TOOL, PAINTBRUSH_TOOL} from "../../../utils/Constants";
import {AlertContext} from "../../../contexts/AlertContext";

const {InferenceType} = require("../../../utils/Constants");
const {Space1, Space2} = require("../../common/Spaces");
const {photoshopApp} = require("../../../photoshop/PhotoshopApp");
const {BrushToolIcon, EraserToolIcon} = require("../../common/Icons");

export const MaskLayerControls = ({ inferenceType }) => {
  const alertContext = useContext(AlertContext);

  const selectMaskBrushTool = async () => {
    await photoshopApp.setForegroundColor(0, 255, 255)
    await photoshopApp.pickTool(PAINTBRUSH_TOOL)

    // If the user picks the mask brush tool, they want to draw on the mask
    // Hence, let's check if the currently active layer is a mask and if not, activate the most recent visible mask
    // It's a little feature that might be handy
    if (photoshopApp.isMaskLayer(photoshopApp.getActiveLayer())) {
      return
    }

    const maskLayer = photoshopApp.getLatestVisibleMaskLayer();
    if (maskLayer) {
      await photoshopApp.activateLayer(maskLayer._id);
    }
  }

  const selectMaskEraserTool = async () => {
    await photoshopApp.pickTool(ERASER_TOOL);
  }

  const newMaskLayer = async () => {
    const layerName = await photoshopApp.createMaskLayer();
    alertContext.setSuccess(<>Added new layer "{layerName}"</>);
    await selectMaskBrushTool();
  }

  const clearMaskLayers = async () => {
    await photoshopApp.clearMaskLayers()
    alertContext.setSuccess(<>Removed all mask layers</>);
  }

  return (
    <>
      {inferenceType === InferenceType.INPAINT ? (
        <>
          <Space2 />
          <div className="container flexRow">
            <sp-action-button
              class="maskLayerButton"
              variant="primary"
              onClick={newMaskLayer}
            >New Mask Layer</sp-action-button>
            <Space1 />
            <sp-action-button
              class="maskLayerButton"
              variant="primary"
              onClick={clearMaskLayers}
            >Clear Mask Layers</sp-action-button>
            <Space1 />
            <sp-action-button
              class="toolButton"
              title="Pick Brush tool"
              onClick={selectMaskBrushTool}
            >
              <span slot="icon"><BrushToolIcon /></span>
            </sp-action-button>
            <sp-action-button
              class="toolButton"
              title="Pick Eraser tool"
              onClick={selectMaskEraserTool}
            >
              <span slot="icon"><EraserToolIcon /></span>
            </sp-action-button>
          </div>
        </>
      ) : null}
    </>
  );
}
