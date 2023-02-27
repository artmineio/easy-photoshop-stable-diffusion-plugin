import React, {useEffect, useState} from "react";
import {localServerApi} from "../../../api/localServerApi";

const {LineArrowDownIcon, LineArrowRightIcon} = require("../../common/Icons");
const {trueOrUndefined} = require("../../../utils/utils");
const {InferenceType} = require("../../../utils/Constants");

const MASKED_CONTENT_OPTIONS = [
  "fill",
  "original",
  "latent noise",
  "latent nothing",
]

export const AdvancedOptions = ({
  inferenceType,
  samplingMethod,
  onSamplingMethodChange,
  samplingSteps,
  onSamplingStepsChange,
  maskBlur,
  onMaskBlurChange,
  maskedContent,
  onMaskedContentChange,
  restoreFaces,
  onRestoreFacesChange,
  isAdvancedOptionsExpanded,
  onIsAdvancedOptionsExpandedChange,
}) => {
  const [samplers, setSamplers] = useState([])

  const onShowAdvancedClicked = () => {
    onIsAdvancedOptionsExpandedChange(!isAdvancedOptionsExpanded);
  }

  const loadSamplers = async () => {
    const samplers = await localServerApi.getSamplers()
    setSamplers(samplers);
  }

  useEffect(() => {
    loadSamplers();
  }, [])


  return (
    <>
      {!isAdvancedOptionsExpanded ? (
        <>
          <div className="container flexRow advancedOptionsLabel" onClick={onShowAdvancedClicked}>
            <span
              className="advancedOptionsIcon"
              slot="icon"
            ><LineArrowRightIcon /></span>
            <sp-body size="S">Show advanced options</sp-body>
          </div>
          <sp-divider size="small"></sp-divider>
        </>
      ) : (
        <>
          <div className="container flexRow advancedOptionsLabel" onClick={onShowAdvancedClicked}>
            <span
              className="advancedOptionsIcon"
              slot="icon"
            ><LineArrowDownIcon /></span>
            <sp-body size="S">Hide advanced options</sp-body>
          </div>
          <sp-divider size="small"></sp-divider>
          <div className="container flexRow">
            <sp-picker
              class="modelDropdown"
            >
              <sp-label slot="label">Sampling method</sp-label>
              <sp-menu
                slot="options"
                onClick={(e) => onSamplingMethodChange(e.target.value)}
              >
                {samplers.map(sampler => (
                  <sp-menu-item
                    key={sampler.samplerName}
                    selected={trueOrUndefined(sampler.samplerName === samplingMethod)}
                    value={sampler.samplerName}
                  >
                    {sampler.samplerName}
                  </sp-menu-item>
                ))}
              </sp-menu>
            </sp-picker>
          </div>
          <div className="container flexColumn">
            <sp-slider
              class="fullWidthSlider"
              min="1"
              max="150"
              value={samplingSteps}
              onInput={(e) => onSamplingStepsChange(e.target.value)}
            >
              <sp-label slot="label">Sampling steps</sp-label>
            </sp-slider>
          </div>
          {inferenceType === InferenceType.INPAINT ? (
            <>
              <div className="container flexRow">
                <sp-picker
                  class="modelDropdown"
                >
                  <sp-label slot="label">Masked content</sp-label>
                  <sp-menu
                    slot="options"
                    onClick={(e) => onMaskedContentChange(e.target.value)}
                  >
                    {MASKED_CONTENT_OPTIONS.map(maskedContentOption => (
                      <sp-menu-item
                        key={maskedContentOption}
                        selected={trueOrUndefined(maskedContentOption === maskedContent)}
                        value={maskedContentOption}
                      >
                        {maskedContentOption}
                      </sp-menu-item>
                    ))}
                  </sp-menu>
                </sp-picker>
              </div>
              <div className="container flexColumn">
                <sp-slider
                  class="fullWidthSlider"
                  min="0"
                  max="64"
                  value={maskBlur}
                  onInput={(e) => onMaskBlurChange(e.target.value)}
                >
                  <sp-label slot="label">Mask blur</sp-label>
                </sp-slider>
              </div>
            </>
          ) : null}
          <div className="container flexColumn">
            <sp-checkbox
              onClick={() => onRestoreFacesChange(!restoreFaces)}
              checked={trueOrUndefined(restoreFaces)}
            >
              Restore faces
            </sp-checkbox>
          </div>
        </>
      )}
    </>
  );
}
