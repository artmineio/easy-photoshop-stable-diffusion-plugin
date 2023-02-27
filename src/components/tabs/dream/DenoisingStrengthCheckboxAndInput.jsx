import React, {useState} from "react";

const {DiceIcon} = require ("../../common/Icons");
const {InfoIconWithTooltip} = require ("../../common/InfoIconWithTooltip");
const {Space1} = require ("../../common/Spaces");
const {DEFAULT_DENOISING_STRENGTH, InferenceType} = require ("../../../utils/Constants");

export const DenoisingStrengthCheckboxAndInput = ({inferenceType, denoisingStrength, onDenoisingStrengthChange}) => {
  const [isRandomDenoisingStrengthChecked, setIsRandomDenoisingStrengthChecked] = useState(denoisingStrength === null)
  const [lastNonNullDenoisingStrength, setLastNonNullDenoisingStrength] = useState(
    denoisingStrength ?? DEFAULT_DENOISING_STRENGTH
  );

  const onDiceButtonClicked = () => {
    setIsRandomDenoisingStrengthChecked(true);
    // null is considered random
    onDenoisingStrengthChange(null);
  }

  const onCheckboxClicked = () => {
    setIsRandomDenoisingStrengthChecked(false);
    // Revert to the last non-random denoising strength
    onDenoisingStrengthChange(lastNonNullDenoisingStrength);
  }

  const onDenoisingStrengthChangeInternal = (denoisingStrength) => {
    // Remember last non-null denoising strength so that we can revert to it after user clicks on random
    setLastNonNullDenoisingStrength(denoisingStrength);
    onDenoisingStrengthChange(denoisingStrength);
  }

  return (
    <>
      {inferenceType === InferenceType.IMG_2_IMG || inferenceType === InferenceType.INPAINT ? (
        <div className="container flexRow">
          {isRandomDenoisingStrengthChecked ? (
            <sp-checkbox
              onClick={onCheckboxClicked}
              checked={true}
            >
              Random Denoising Strength
            </sp-checkbox>
          ) : (
            <>
              <sp-slider
                class="fullWidthSlider"
                min="0"
                max="1"
                step="0.01"
                value={denoisingStrength}
                onInput={(e) => onDenoisingStrengthChangeInternal(e.target.value)}
              >
                <sp-label slot="label">Denoising Strength</sp-label>
              </sp-slider>
              <sp-action-button
                class="randomCfgOrDsButton"
                title="Choose Denoising Strength randomly"
                onClick={onDiceButtonClicked}
              >
                <span slot="icon"><DiceIcon /></span>
              </sp-action-button>
              <Space1/>
            </>
          )}
          <InfoIconWithTooltip marginTop={isRandomDenoisingStrengthChecked ? 0 : 24}>
            {isRandomDenoisingStrengthChecked ? (
              <div>try random values from different ranges for each image to see what works best</div>
            ) : (
              <div>smaller denoising strength means more similarity to the original image</div>
            )}
          </InfoIconWithTooltip>
        </div>
      ) : null}
    </>
  );
}
