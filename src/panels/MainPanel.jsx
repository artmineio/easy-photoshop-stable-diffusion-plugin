import {photoshopApp} from "../photoshop/PhotoshopApp";

require("../components/common/Common.css");
const {PromptsTab} = require ("../components/tabs/PromptsTab");
const {FullScreenModalSelector, ModalName} = require ("../components/modals/FullScreenModalSelector");
const {Space2, Space3} = require ("../components/common/Spaces");
const {runShowingErrors} = require ("../exceptions/exceptionHandlers");
const {NetworkError} = require ("../exceptions/Exceptions");
const React = require("react");
const {useContext} = require("react");
const {MainTab, MainTabSelection} = require("../components/common/MainTabSelection");
const {localServerApi} = require("../api/localServerApi");
const {ResultsTab} = require("../components/tabs/ResultsTab");
const {settingsStorage} = require("../utils/SettingsStorage");
const {DreamTab} = require("../components/tabs/DreamTab");
const {AlertContext} = require("../contexts/AlertContext");
const {MainAlert} = require("../components/alerts/MainAlert");
const {ModalContext} = require("../contexts/ModalContext");


const STORED_PROMPTS_WRITE_FREQUENCY_MS = 5000

class MainPanelInternal extends React.Component {

  constructor(props) {
    super(props);

    const mainPanelSettings = settingsStorage.getMainPanelSettings();
    this.state = {
      currentTab: MainTab.DREAM,
      progress: 0,
      canCancelProgress: false,
      isProcessing: false,
      resultGroups: [],
      storedPrompts: [],
      storedPromptsText: "{}",
      storedPromptsTextError: null,
      lastRequestId: null,
      sourceLayer: null,
      isLoadingModels: false,
      ...mainPanelSettings,
    }
    this.writeStoredPromptsToBackendInterval = null;
    this.needWritePrompts = false;
  }

  async componentDidMount() {
    if (!photoshopApp.hasActiveDocument()) {
      // Tell the user to open a document
      console.log("No active documents available!");
      this.props.modalContext.setModal({
        modalName: ModalName.BAD_DOCUMENT_STATE,
      });
      return
    }

    const isReachable = await localServerApi.isLocalServerAndAutomatic1111Reachable()
    // TODO: this code is also seen in LocalServerUnavailableModal and Automatic1111UnavailableModal. Refactor
    if (!isReachable.isLocalServerReachable) {
      // Local server is not reachable
      console.log("Local server is not reachable!");
      this.props.modalContext.setModal({
        modalName: ModalName.LOCAL_SERVER_UNAVAILABLE,
      });
      return
    }

    if (!isReachable.isAutomatic1111Reachable) {
      // Local server is now reachable but Automatic1111 is not
      console.log("Automatic1111 is not reachable!");
      this.props.modalContext.setModal({
        modalName: ModalName.AUTOMATIC1111_UNAVAILABLE,
      });
      return
    }

    try {
      // Load initial resultGroups from previous sessions
      const resultGroups = await localServerApi.getAllResults()
      this.setState({resultGroups})

      const storedPromptsJson = await localServerApi.getStoredPrompts()
      const storedPrompts = this.storedPromptsJsonToList(storedPromptsJson)
      const storedPromptsText = JSON.stringify(storedPromptsJson, null, 2)
      this.setState({storedPrompts, storedPromptsText})

      // Periodically write stored prompts to backend. The alternative is to add "Apply" button to the prompts tab
      // However, that would go against the whole idea of this plugin maintaining its state without any additional effort
      this.writeStoredPromptsToBackendInterval = setInterval(
        this.maybeWriteStoredPromptsToBackend,
        STORED_PROMPTS_WRITE_FREQUENCY_MS,
      );
    } catch (e) {
      this.props.alertContext.setError(<>{e.message}</>)
    }
  }

  componentWillUnmount() {
    if (this.writeStoredPromptsToBackendInterval) {
      // Make sure to write the recent changes if the interval was set
      // Doing this only when interval exists ensures we don't try to write empty array to backend
      this.maybeWriteStoredPromptsToBackend()
      clearInterval(this.writeStoredPromptsToBackendInterval)
    }
  }

  onStoredPromptsChange = (storedPrompts) => {
    try {
      const promptsJson = this.storedPromptsToJson(storedPrompts);
      const storedPromptsText = JSON.stringify(promptsJson, null, 2);
      console.log("Updating stored prompts", storedPromptsText)
      this.setState({ storedPrompts, storedPromptsText, storedPromptsTextError: null });
      this.needWritePrompts = true;
    } catch (e) {
      this.props.alertContext.setError(<>{e.message}</>)
    }
  }

  onStoredPromptsTextChange = (storedPromptsText) => {
    try {
      // For some reason Photoshop seems to replace double quotes with these two types of back-ticks that
      // look almost exactly the same, so let's clean them
      storedPromptsText = storedPromptsText.replaceAll('”', '"').replaceAll('“', '"');
      let storedPromptsJson;
      try {
        storedPromptsJson = JSON.parse(storedPromptsText);
      } catch (e) {
        console.log("Could not parse prompts text");
        this.setState({storedPromptsTextError: "Make sure to enter a correct JSON"})
        return
      }

      const storedPrompts = this.storedPromptsJsonToList(storedPromptsJson)
      console.log("Updating stored prompts", storedPromptsText)
      this.setState({storedPrompts, storedPromptsText, storedPromptsTextError: null});
      this.needWritePrompts = true;
    } catch (e) {
      this.props.alertContext.setError(<>{e.message}</>)
    }
  }

  storedPromptsJsonToList = (storedPromptsJson) => {
    return Object.keys(storedPromptsJson).map(promptKey => ({
      promptKey,
      prompt: storedPromptsJson[promptKey],
    }));
  }

  storedPromptsToJson = (storedPrompts) => {
    return storedPrompts.reduce(
      (json, currentPrompt) => {
        json[currentPrompt.promptKey] = currentPrompt.prompt;
        return json;
      },
      {}
    );
  }

  onBeforeDreamButtonClicked = async () => {
    // Make sure we flush all of the recent prompts to backend before proceeding
    await this.maybeWriteStoredPromptsToBackend();
  }

  maybeWriteStoredPromptsToBackend = async () => {
    try {
      if (!this.needWritePrompts) {
        return;
      }

      const promptsJson = this.storedPromptsToJson(this.state.storedPrompts);
      await localServerApi.setStoredPrompts(promptsJson)
      this.needWritePrompts = false;
    } catch (e) {
      this.props.alertContext.setError(<>{e.message}</>)
    }
  }

  onCurrentTabChange = (currentTab) => {
    this.setState({currentTab})
  }

  onProgress = ({progress, canCancelProgress, isProcessing}) => {
    // canCancelProgress is not the same as isProcessing, because when the user clicks "cancel",
    // we stop showing the progress bar and disable the cancellation button
    // However, in the meantime image processing might still be stopping, so we can't process more
    if (progress !== undefined) {
      this.setState({progress})
    }
    if (canCancelProgress !== undefined) {
      this.setState({canCancelProgress})
    }
    if (isProcessing !== undefined) {
      this.setState({isProcessing})
    }
  }

  onResults = (resultGroups, lastRequestId) => {
    this.setState({resultGroups, lastRequestId})
    this.setState({currentTab: MainTab.RESULTS})
  }

  onSourceLayerChange = (sourceLayer) => {
    this.setState({ sourceLayer });
  }

  onIsLoadingModelsChange = (isLoadingModels) => {
    this.setState({ isLoadingModels });
  }

  onSeedChange = (seed) => {
    this.setState({ seed });
    settingsStorage.updateMainPanelSettingsSync({ seed })
  }

  onCfgScaleChange = (cfgScale) => {
    this.setState({ cfgScale });
    settingsStorage.updateMainPanelSettingsSync({ cfgScale })
  }

  onDenoisingStrengthChange = (denoisingStrength) => {
    this.setState({ denoisingStrength });
    settingsStorage.updateMainPanelSettingsSync({ denoisingStrength })
  }

  render() {
    const {modalName} = this.props.modalContext.modal;
    const {alertContent} = this.props.alertContext.topAlert;

    const {
      currentTab,
      progress,
      canCancelProgress,
      isProcessing,
      resultGroups,
      storedPrompts,
      storedPromptsText,
      storedPromptsTextError,
      sourceLayer,
      isLoadingModels,
      seed,
      cfgScale,
      denoisingStrength,
    } = this.state;
    return (
      <div className="container flexColumn">
        {!!alertContent ? (
          <MainAlert />
        ) : isProcessing ? (
          <div className="container flexRow generateProgressBarContainer">
            <sp-progressbar class="generateProgressBar" max={100} value={progress}></sp-progressbar>
          </div>
        ) : (
          <Space3 />
        )}

        {!!modalName ? (
          <FullScreenModalSelector modalName={modalName}/>
        ) : (
          <>
            <MainTabSelection currentTab={currentTab} onCurrentTabChange={this.onCurrentTabChange}/>
            <Space2 />

            {currentTab === MainTab.DREAM ? (
              <DreamTab
                seed={seed}
                onSeedChange={this.onSeedChange}
                cfgScale={cfgScale}
                onCfgScaleChange={this.onCfgScaleChange}
                denoisingStrength={denoisingStrength}
                onDenoisingStrengthChange={this.onDenoisingStrengthChange}
                isProcessing={isProcessing}
                canCancelProgress={canCancelProgress}
                onBeforeDreamButtonClicked={this.onBeforeDreamButtonClicked}
                onProgress={this.onProgress}
                onResults={this.onResults}
                sourceLayer={sourceLayer}
                onSourceLayerChange={this.onSourceLayerChange}
                isLoadingModels={isLoadingModels}
                onIsLoadingModelsChange={this.onIsLoadingModelsChange}
                storedPrompts={storedPrompts}
                onStoredPromptsChange={this.onStoredPromptsChange}
              />
            ) : null}
            {currentTab === MainTab.RESULTS ? (
              <ResultsTab
                resultGroups={resultGroups}
                onSeedChange={this.onSeedChange}
                onCfgScaleChange={this.onCfgScaleChange}
                onDenoisingStrengthChange={this.onDenoisingStrengthChange}
              />
            ) : null}
            {currentTab === MainTab.PROMPTS ? (
              <PromptsTab
                storedPrompts={storedPrompts}
                storedPromptsText={storedPromptsText}
                storedPromptsTextError={storedPromptsTextError}
                onStoredPromptsChange={this.onStoredPromptsChange}
                onStoredPromptsTextChange={this.onStoredPromptsTextChange}
              />
            ) : null}
          </>
        )}
      </div>
    );
  }
}

export const MainPanel = () => {
  const modalContext = useContext(ModalContext);
  const alertContext = useContext(AlertContext);

  return (
    <MainPanelInternal modalContext={modalContext} alertContext={alertContext}/>
  );
}
