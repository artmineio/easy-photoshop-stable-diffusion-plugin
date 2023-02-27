import "./ResultsTab.css";
import React, {useContext} from "react";
import {photoshopApp} from "../../photoshop/PhotoshopApp";
import {Space1} from "../common/Spaces";
import {AlertContext} from "../../contexts/AlertContext";

const {STATIC_FILES_URL} = require("../../utils/Constants");
const {chunkArray} = require("../../utils/utils");
const {LineArrowDownIcon, LineArrowRightIcon} = require("../common/Icons");
const {settingsStorage} = require("../../utils/SettingsStorage");

const LAYER_NAME_MAX_PROMPT_CHARS = 20
const LAYER_ALERT_CHARS = 10
const NON_ALPHANUMERIC_REGEX = /[^a-zA-Z0-9\-_]+/g

const ResultItem = (
  {
    prompt,
    imageFileName,
    thumbnailFileName,
    seed,
    onSeedChange,
    cfgScale,
    onCfgScaleChange,
    denoisingStrength,
    onDenoisingStrengthChange,
  }
) => {
  const alertContext = useContext(AlertContext);

  const displayCfgScale = Math.round(cfgScale * 100) / 100
  const displayDenoisingStrength = denoisingStrength ? Math.round(denoisingStrength * 100) / 100 : 0

  const onImageToLayerClick = async () => {
    try {
      const firstPromptChars = prompt.replace(NON_ALPHANUMERIC_REGEX, " ").slice(0, LAYER_NAME_MAX_PROMPT_CHARS)
      let layerName = `${firstPromptChars}. Seed ${seed}. CFG ${displayCfgScale}`
      if (displayDenoisingStrength) {
        layerName += `. DS ${displayDenoisingStrength}`
      }
      const topVisibleLayerId = photoshopApp.getTopVisibleLayerId()
      if (topVisibleLayerId !== null) {
        // Activate the top visible layer so that the new layer is not occluded by any of the existing layers
        await photoshopApp.activateLayer(topVisibleLayerId)
      }
      await photoshopApp.openImageAsLayerInActiveDocument(layerName, imageFileName)
      const trimmedLayerName = `${layerName.slice(0, LAYER_ALERT_CHARS)}...`
      alertContext.setSuccess(<>Added result as layer "{trimmedLayerName}"</>)
    } catch (e) {
      alertContext.setError(<>{e.message}</>)
    }
  }

  const onCopySeedClick = async () => {
    onSeedChange(seed)
    alertContext.setSuccess(<>Set seed to {seed}</>)
  }

  const onCopyCfgScaleClick = async () => {
    onCfgScaleChange(cfgScale)
    alertContext.setSuccess(<>Set CFG scale to {cfgScale}</>)
  }

  const onCopyDenoisingStrengthClick = async () => {
    onDenoisingStrengthChange(denoisingStrength)
    alertContext.setSuccess(<>Set Denoising Strength to {denoisingStrength}</>)
  }

  return (
    <>
      <div className="container flexColumn resultItem">
          <img src={`${STATIC_FILES_URL}/${thumbnailFileName}`} className="resultThumbnailImage"/>
          <div className="container flexRow justifyContentCenter">
            <sp-action-button
              class="resultControlsButton"
              variant="secondary"
              onClick={onImageToLayerClick}
            >To Layer
            </sp-action-button>
          </div>
          <div className="container flexRow justifyContentCenter">
            <sp-action-button
              class="resultControlsButton"
              variant="secondary"
              onClick={onCopySeedClick}
            >Copy Seed
            </sp-action-button>
          </div>
          <div className="container flexRow justifyContentCenter">
            <sp-action-button
              class="resultControlsButton"
              variant="secondary"
              onClick={onCopyCfgScaleClick}
            >Copy CFG {displayCfgScale}
            </sp-action-button>
            {!!denoisingStrength ? (
              <sp-action-button
                class="resultControlsButton"
                variant="secondary"
                onClick={onCopyDenoisingStrengthClick}
              >Copy DS {displayDenoisingStrength}
              </sp-action-button>
            ) : null}
          </div>
      </div>
    </>
  )
}

const ResultGroup = (
  {
    prompt,
    negativePrompt,
    groupItems,
    isCollapsed,
    onIsCollapsedChange,
    onSeedChange,
    onCfgScaleChange,
    onDenoisingStrengthChange,
  }
) => {
  const itemsChunkedInPairs = chunkArray(groupItems, 2)
  const promptAndNegativePrompt = prompt + (negativePrompt ? ` / ${negativePrompt}` : "");
  return (
    <>
      <div className="container flexColumn">
        <div className="container flexRow advancedOptionsLabel" onClick={onIsCollapsedChange}>
          {isCollapsed ? (
            <span
              className="advancedOptionsIcon"
              slot="icon"
            ><LineArrowRightIcon /></span>
          ) : (
            <span
              className="advancedOptionsIcon"
              slot="icon"
            ><LineArrowDownIcon /></span>
          )}
          <div className="resultsPrompt">{promptAndNegativePrompt}</div>
        </div>
        <sp-divider size="medium"></sp-divider>
        <Space1 />
        {!isCollapsed ? (
          <>
            {itemsChunkedInPairs.map(pair => (
              <div
                className="container flexRow justifyContentCenter"
                key={`${pair[0].thumbnail_file_name}~${pair.legend >= 2 ? pair[1].thumbnail_file_name : ""}`}
              >
                  {pair.length >= 2 ? (
                    <>
                      <ResultItem
                        prompt={prompt}
                        imageFileName={pair[0].image_file_name}
                        thumbnailFileName={pair[0].thumbnail_file_name}
                        seed={pair[0].seed}
                        onSeedChange={onSeedChange}
                        cfgScale={pair[0].cfg_scale}
                        onCfgScaleChange={onCfgScaleChange}
                        denoisingStrength={pair[0].denoising_strength}
                        onDenoisingStrengthChange={onDenoisingStrengthChange}
                      />
                      <ResultItem
                        prompt={prompt}
                        imageFileName={pair[1].image_file_name}
                        thumbnailFileName={pair[1].thumbnail_file_name}
                        seed={pair[1].seed}
                        onSeedChange={onSeedChange}
                        cfgScale={pair[1].cfg_scale}
                        onCfgScaleChange={onCfgScaleChange}
                        denoisingStrength={pair[1].denoising_strength}
                        onDenoisingStrengthChange={onDenoisingStrengthChange}
                      />
                    </>
                  ) : (
                    <>
                      <ResultItem
                        prompt={prompt}
                        imageFileName={pair[0].image_file_name}
                        thumbnailFileName={pair[0].thumbnail_file_name}
                        seed={pair[0].seed}
                        onSeedChange={onSeedChange}
                        cfgScale={pair[0].cfg_scale}
                        onCfgScaleChange={onCfgScaleChange}
                        denoisingStrength={pair[0].denoising_strength}
                        onDenoisingStrengthChange={onDenoisingStrengthChange}
                      />
                      <div className="container flexColumn resultItem">
                        <img className="resultThumbnailImage"/>
                      </div>
                    </>
                  )}
              </div>
            ))}
          </>
        ) : null}
      </div>
    </>
  )
}

export class ResultsTab extends React.Component {

  constructor(props) {
    super(props);

    const requestIds = new Set (this.props.resultGroups.map(resultGroup => resultGroup.request_id))
    const collapsedResultsMap = settingsStorage.getResultsSettings().collapsedResultsMap

    Object.keys(collapsedResultsMap).forEach((requestId) => {
      // Only load for requests which results are available to prevent unbounded growth of the map
      if (!requestIds.has(requestId)) {
        delete collapsedResultsMap[requestId];
      }
    });

    this.state = {
      collapsedResultsMap,
    }
  }

  onIsCollapsedChange = (requestId, isCollapsed) => {
    try {
      const newCollapsedResultsMap = {
        ...this.state.collapsedResultsMap,
        [requestId]: isCollapsed,
      };
      this.setState({
        collapsedResultsMap: newCollapsedResultsMap,
      })
      settingsStorage.saveResultsSettingsSync({
        collapsedResultsMap: newCollapsedResultsMap,
      })
    } catch (e) {
      console.error(e)
    }
  }

  render() {
    let {
      resultGroups,
      onSeedChange,
      onCfgScaleChange,
      onDenoisingStrengthChange,
    } = this.props;
    let {collapsedResultsMap} = this.state;

    if (resultGroups.length <= 0) {
      return (
        <div className="container flexRow justifyContentCenter">
          <sp-body size="S">No results to show, please use Dream tab first</sp-body>
        </div>
      )
    }
    return (
      <>
        <div className="container flexColumn">
          {resultGroups.map(resultGroup => {
            const isCollapsed = collapsedResultsMap[resultGroup.request_id] ?? false;
            return (
              <ResultGroup
                key={resultGroup.request_id}
                prompt={resultGroup.prompt}
                negativePrompt={resultGroup.negative_prompt}
                groupItems={resultGroup.group_items}
                isCollapsed={isCollapsed}
                onIsCollapsedChange={() => this.onIsCollapsedChange(resultGroup.request_id, !isCollapsed)}
                onSeedChange={onSeedChange}
                onCfgScaleChange={onCfgScaleChange}
                onDenoisingStrengthChange={onDenoisingStrengthChange}
              />
            );
          })}
        </div>
      </>
    );
  }
}
