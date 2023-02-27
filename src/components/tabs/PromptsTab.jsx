import "./PromptsTab.css";
const React = require("react");
const {useContext} = require("react");
const {Space1, Space2} = require("../common/Spaces");
const {HowToBanner} = require("./dream/HowToBanner");
const {AlertContext} = require("../../contexts/AlertContext");

const {settingsStorage} = require("../../utils/SettingsStorage");

const SinglePrompt = (
  {
    promptKey,
    onPromptKeyChange,
    prompt,
    onPromptChange,
  }
) => {
  return (
    <>
      <div className="container flexColumn">
        <div className="container flexRow">
          <div>
            <sp-body size="XL" class="storedPromptKeyBrace">{"{"}</sp-body>
          </div>
          <sp-textfield
            class="storedPromptKeyText"
            placeholder="Enter prompt shortcut"
            onInput={(e) => onPromptKeyChange(e.target.value)}
            value={promptKey}
          ></sp-textfield>
          <div>
            <sp-body size="XL" class="storedPromptKeyBrace">{"}"}</sp-body>
          </div>
        </div>
        <div className="container flexRow">
          <sp-textarea
            class="storedPromptTextArea"
            placeholder="Enter prompt"
            value={prompt}
            onInput={(e) => onPromptChange(e.target.value)}
          ></sp-textarea>
        </div>
        <Space2 />
      </div>
    </>
  )
}

const AllPromptsTextArea = (
  {
    storedPromptsText,
    onStoredPromptsTextChange,
    storedPromptsTextError,
  }
) => {
  let className = "allStoredPromptsTextArea"
  if (storedPromptsTextError) {
    className += " error"
  }
  return (
    <>
      <div className="container flexRow">
        <sp-textarea
          class={className}
          placeholder="Enter prompts as JSON"
          value={storedPromptsText ?? "{}"}
          onInput={(e) => onStoredPromptsTextChange(e.target.value)}
        ></sp-textarea>
      </div>
      <sp-body size="XS" class="allStoredPromptsErrorText">{storedPromptsTextError}</sp-body>
    </>
  )
}

class PromptsTabInternal extends React.Component {

  constructor(props) {
    super(props);

    const savedOrDefaultSettings = settingsStorage.getPromptsSettings()
    this.state = {
      ...savedOrDefaultSettings,
    };
  }

  onPromptKeyChange = (index, promptKey) => {
    try {
      // TODO: this might be slow. We might need to add a save button or do some kind of batching
      const { storedPrompts, onStoredPromptsChange } = this.props;
      const updatedPrompts = [...storedPrompts]
      updatedPrompts[index].promptKey = promptKey
      onStoredPromptsChange(updatedPrompts)
    } catch (e) {
      console.error(e);
    }
  }

  onPromptChange = (index, prompt) => {
    try {
      const { storedPrompts, onStoredPromptsChange } = this.props;
      const updatedPrompts = [...storedPrompts]
      updatedPrompts[index].prompt = prompt
      onStoredPromptsChange(updatedPrompts)
    } catch (e) {
      console.error(e);
    }
  }

  onAddPrompt = () => {
    try {
      const { storedPrompts, onStoredPromptsChange } = this.props;
      const existingPromptWithEmptyKey = storedPrompts.find(storedPrompt => storedPrompt.promptKey === "")
      if (existingPromptWithEmptyKey) {
        this.props.alertContext.setError(<>Please set the existing empty shortcut first</>)
        return
      }

      const emptyPrompt = {
        promptKey: "",
        prompt: "",
      }
      const updatedPrompts = [...storedPrompts, emptyPrompt]
      onStoredPromptsChange(updatedPrompts)
    } catch (e) {
      console.error(e);
    }
  }

  onShowInstructionsChange = (showInstructions) => {
    this.setState({showInstructions})
    settingsStorage.updatePromptsSettingsSync({showInstructions})
  }

  onShowAsTextChange = (showAsText) => {
    this.setState({showAsText})
    settingsStorage.updatePromptsSettingsSync({showAsText})
  }

  render() {
    const {
      storedPrompts,
      storedPromptsText,
      onStoredPromptsTextChange,
      storedPromptsTextError,
    } = this.props;
    const {
      showInstructions,
      showAsText,
    } = this.state;
    return (
      <>
        <div className="container flexColumn">
          <div className="container flexRow instructionsBanner">
            <sp-icon size="xxs" name="ui:InfoMedium" class="instructionsIcon"></sp-icon>
            <Space2/>
            <HowToBanner
              isExpanded={showInstructions}
              onIsExpandedChange={this.onShowInstructionsChange}
            >
              <>
                Prompt shortcuts can be used to save your favorite prompts and use them later without typing them out.
              </>
              <>
                For example, if you have a stored prompt with shortcut "cartoonish"
                pointing to "(drawn), cartoon, (animation:0.5)", then any {"{cartoonish}"} in
                your prompt (or negative prompt) will be replaced with "(drawn), cartoon, (animation:0.5)".
              </>
              <>
                The round braces around words adjust strength of the prompt. In the above example "drawn" will have
                stronger weight, while "animation" will have half a weight.
              </>
            </HowToBanner>
          </div>
          <Space2/>
          {showAsText ? (
            <div className="container flexRow justifyContentCenter">
              <sp-link
                onClick={() => this.onShowAsTextChange(false)}
              >Show As List
              </sp-link>
            </div>
          ) : (
            <div className="container flexRow justifyContentCenter">
              <sp-link
                onClick={() => this.onShowAsTextChange(true)}
              >Show As Text
              </sp-link>
            </div>
          )}
          <Space2/>
          {showAsText ? (
            <AllPromptsTextArea
              storedPromptsText={storedPromptsText}
              onStoredPromptsTextChange={onStoredPromptsTextChange}
              storedPromptsTextError={storedPromptsTextError}
            />
          ) : (
            <>
              {storedPrompts.map((storedPrompt, index) => {
                return (
                  <SinglePrompt
                    key={String(index)}
                    promptKey={storedPrompt.promptKey}
                    onPromptKeyChange={(promptKey) => this.onPromptKeyChange(index, promptKey)}
                    prompt={storedPrompt.prompt}
                    onPromptChange={(prompt) => this.onPromptChange(index, prompt)}
                  />
                );
              })}
            </>
          )}
          <Space1/>
          <sp-action-button
            class="addPromptButton"
            onClick={() => this.onAddPrompt()}
          >Add Prompt Shortcut
          </sp-action-button>
        </div>
      </>
    );
  }
}

export const PromptsTab = (props) => {
  const alertContext = useContext(AlertContext);

  return (
    <PromptsTabInternal {...props} alertContext={alertContext}/>
  );
}
