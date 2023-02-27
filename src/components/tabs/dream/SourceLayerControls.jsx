import {Space3} from "../../common/Spaces";
import {AlertContext} from "../../../contexts/AlertContext";

const {useContext} = require("react");

const React = require('react');
const {InferenceType} = require("../../../utils/Constants");
const {Space2} = require("../../common/Spaces");
const {trueOrUndefined} = require("../../../utils/utils");
const {RefreshIcon} = require("../../common/Icons");
const {photoshopApp} = require("../../../photoshop/PhotoshopApp");

class SourceLayerControlsInternal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      layers: [],
    }
  }

  async componentDidMount() {
    const sourceLayerId = await this.reloadLayers();
    if (!sourceLayerId) {
      // If previously selected layer is gone, pick the most bottom layer
      await this.autoPickMostBottomLayer();
    }
  }

  onSourceLayerChangeInternal = async (sourceLayerId) => {
    try {
      // If the selected layer is background, let's convert it to the regular layer with the same name
      // as it's more convenient to work with it (e.g. background can't be exported to a file)
      // Hopefully this should not matter to most users as it will look the same
      const layer = photoshopApp.maybeGetLayerById(sourceLayerId)
      if (layer) {
        this.props.onSourceLayerChange({
          _id: layer._id,
          name: layer.name,
        });
      } else {
        this.props.onSourceLayerChange(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  onMenuItemClick = async (event) => {
    // We don't want the parent picker to detect a click to reload the layers again as the state change set here
    // is not yet propagated
    event.stopPropagation();
    const sourceLayerId = parseInt(event.target.value)
    const sourceLayer = photoshopApp.maybeGetLayerById(sourceLayerId)
    if (sourceLayer && photoshopApp.isMaskLayer(sourceLayer)) {
      // There doesn't seem to be a way to stop Photoshop from selecting the picked element via event.preventDefault
      // So let's just show a brief error
      this.props.alertContext.setError(<>Please pick a source layer instead of a Mask Layer</>)
    }
    await this.onSourceLayerChangeInternal(sourceLayerId)
  }

  reloadLayers = async () => {
    try {
      const visibleLayers = photoshopApp.getVisibleLayers()
        .filter(layer => !photoshopApp.isMaskLayer(layer));
      const layers = visibleLayers.map(layer => ({_id: layer._id, name: layer.name}))
      this.setState({layers})

      const selectedLayer = layers.find(layer => layer._id === this.props.sourceLayer?._id)
      if (selectedLayer) {
        // See if previously selected layer is there
        await this.onSourceLayerChangeInternal(selectedLayer._id)
        return selectedLayer._id
      }

      this.props.onSourceLayerChange(null)
      return null
    } catch (e) {
      console.error(e);
      return null
    }
  }

  autoPickMostBottomLayer = async () => {
    try {
      const photoshopLayers = photoshopApp.getAllLayers();
      const photoshopLayersBottomFirst = [...photoshopLayers]
      photoshopLayersBottomFirst.reverse();
      const mostBottomVisibleLayer = photoshopLayersBottomFirst.find(layer => {
        return layer.visible && !photoshopApp.isMaskLayer(layer)
      })
      if (mostBottomVisibleLayer) {
        await this.onSourceLayerChangeInternal(mostBottomVisibleLayer._id)
        return
      }
      this.props.onSourceLayerChange(null)
    } catch (e) {
      console.error(e);
    }
  }

  setSourceLayerToActive = async () => {
    try {
      await this.reloadLayers();
      const activeLayer = photoshopApp.getActiveLayer();
      if (!activeLayer.visible) {
        this.props.alertContext.setError(<>Please pick a visible layer</>)
        return
      }
      if (photoshopApp.isMaskLayer(activeLayer)) {
        this.props.alertContext.setError(<>Please pick a layer to modify instead of a Mask Layer</>)
        return
      }
      this.props.onSourceLayerChange({
        _id: activeLayer._id,
        name: activeLayer.name,
      });
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    let {inferenceType, sourceLayer} = this.props;
    let {layers} = this.state;
    return (
      <>
        {inferenceType === InferenceType.IMG_2_IMG || inferenceType === InferenceType.INPAINT ? (
          <>
            <Space3/>
            <div className="container flexRow">
              <sp-picker
                class={`sourceLayerDropdown ${!sourceLayer ? "highlighted" : ""}`}
                placeholder="Pick a layer to dream on"
                onClick={this.reloadLayers}
              >
                <sp-menu
                  slot="options"
                  onClick={this.onMenuItemClick}
                >
                  {layers.map(layer => (
                    <sp-menu-item
                      key={`${layer._id}-${layer.name}`}
                      selected={trueOrUndefined(layer._id === sourceLayer?._id)}
                      value={layer._id}
                    >
                      {layer.name}
                    </sp-menu-item>
                  ))}
                </sp-menu>
              </sp-picker>
              <sp-action-button
                class="setSourceLayerButton"
                variant="secondary"
                onClick={this.setSourceLayerToActive}
              >Pick Selected
              </sp-action-button>
              <sp-action-button
                class="refreshButton"
                title="Refresh layers list"
                onClick={this.reloadLayers}>
                <span slot="icon"
                ><RefreshIcon /></span>
              </sp-action-button>
            </div>
          </>
        ) : null}
      </>
    );
  }
}

export const SourceLayerControls = (props) => {
  const alertContext = useContext(AlertContext);

  return (
    <SourceLayerControlsInternal {...props} alertContext={alertContext}/>
  );
}
