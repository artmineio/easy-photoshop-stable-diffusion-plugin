import React, {useState} from "react";

const {DiceIcon} = require("../../common/Icons");
const {InfoIconWithTooltip} = require("../../common/InfoIconWithTooltip");
const {Space1} = require("../../common/Spaces");
const {DEFAULT_CFG_SCALE} = require("../../../utils/Constants");

export const CfgScaleCheckboxAndInput = ({ cfgScale, onCfgScaleChange }) => {
  const [isRandomCfgScaleChecked, setIsRandomCfgScaleChecked] = useState(cfgScale === null)
  const [lastNonNullCfgScale, setLastNonNullCfgScale] = useState(cfgScale ?? DEFAULT_CFG_SCALE);

  const onDiceButtonClicked = () => {
    setIsRandomCfgScaleChecked(true);
    // null is considered random
    onCfgScaleChange(null);
  }

  const onCheckboxClicked = () => {
    setIsRandomCfgScaleChecked(false);
    // Revert to the last non-random CFG scale
    onCfgScaleChange(lastNonNullCfgScale);
  }

  const onCfgScaleChangeInternal = (cfgScale) => {
    // Remember last non-null CFG scale so that we can revert to it after user clicks on random
    setLastNonNullCfgScale(cfgScale);
    onCfgScaleChange(cfgScale);
  }

  return (
    <div className="container flexRow">
      {isRandomCfgScaleChecked ? (
        <sp-checkbox
          onClick={onCheckboxClicked}
          checked={true}
        >
          Random CFG Scale
        </sp-checkbox>
      ) : (
        <>
          <sp-slider
            class="fullWidthSlider"
            min="1"
            max="30"
            step="0.5"
            value={cfgScale}
            onInput={(e) => onCfgScaleChangeInternal(e.target.value)}
          >
            <sp-label slot="label">CFG Scale</sp-label>
          </sp-slider>
          <sp-action-button
            class="randomCfgOrDsButton"
            title="Choose CFG scale randomly"
            onClick={onDiceButtonClicked}
          >
            <span slot="icon"><DiceIcon /></span>
          </sp-action-button>
          <Space1 />
        </>
      )}
      <InfoIconWithTooltip marginTop={isRandomCfgScaleChecked ? 0 : 24}>
        {isRandomCfgScaleChecked ? (
          <div>try random values from different ranges for each image to see what works best</div>
        ) : (
          <div>larger CFG scale puts more weight into the prompt</div>
        )}
      </InfoIconWithTooltip>
    </div>
  );
}
