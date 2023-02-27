import React, {useContext, useState} from "react";
import {CurlyBracesIcon, SaveIcon} from "../../common/Icons";
import {Space1, Space2} from "../../common/Spaces";
import {AlertContext, AlertStyle} from "../../../contexts/AlertContext";

const NON_ALPHANUMERIC_REGEX = /[^a-z0-9 ]+/g
const WORDS_COUNT_FOR_PROMPT_KEY = 3

const PromptControl = (
  {
    placeholder,
    prompt,
    onPromptChange,
    storedPrompts,
    onStoredPromptsChange,
  }
) => {
  const [showStoredPrompts, setShowStoredPrompts] = useState(false);

  const alertContext = useContext(AlertContext);

  const onStorePrompt = () => {
    if (!prompt.trim()) {
      alertContext.setError(<>Please type a prompt to save a shortcut</>)
      return
    }
    // Grab first couple of words from the prompt for the key
    let promptKey = prompt
      .toLowerCase()
      .replace(NON_ALPHANUMERIC_REGEX, " ")
      .split(" ")
      .filter(word => !!word)
      .slice(0, WORDS_COUNT_FOR_PROMPT_KEY)
      .join(" ");
    const existingPromptWithSameKey = storedPrompts.find(storedPrompt => storedPrompt.promptKey === promptKey)
    if (existingPromptWithSameKey) {
      console.log(`Prompt with shortcut ${promptKey} already exists`)
      alertContext.setError(<>Prompt shortcut {`{${promptKey}}`} already exists</>)
      return
    }

    const newPrompt = {
      promptKey,
      prompt,
    }
    const updatedPrompts = [...storedPrompts, newPrompt]
    onStoredPromptsChange(updatedPrompts, newPrompt)
    alertContext.setSuccess(<>Added prompt shortcut {`{${promptKey}}`}</>)
  }

  const onSelectStoredPrompt = (wrappedPromptKey) => {
    const updatedPrompt = prompt
      ? `${prompt}, ${wrappedPromptKey}`
      : wrappedPromptKey;
    onPromptChange(updatedPrompt)
    setShowStoredPrompts(false)
  }

  return (
    <>
      {showStoredPrompts ? (
        <div className="container flexColumn storedPromptKeysSelectionAreaContainer">
          <sp-body size="S" class="storedPromptKeysSelectionAreaLabel">
            Select a prompt shortcut to add&nbsp;
            <sp-link onClick={() => setShowStoredPrompts(false)}>
              or cancel
            </sp-link>
          </sp-body>
          <Space2 />
          <div className="container flexRow flexWrap">
            {storedPrompts.map(storedPrompt => {
              const wrappedPromptKey = `{${storedPrompt.promptKey}}`
              return (
                <sp-action-button
                  class="promptKeyButton"
                  key={storedPrompt.promptKey}
                  onClick={() => onSelectStoredPrompt(wrappedPromptKey)}
                >
                  {wrappedPromptKey}
                </sp-action-button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="container flexRow">
          <sp-textarea
            class="dreamPromptTextArea"
            placeholder={placeholder}
            value={prompt}
            onInput={(e) => onPromptChange(e.target.value)}
          ></sp-textarea>
          <div className="container flexColumn">
            <sp-action-button
              class="iconButton"
              title="Add a prompt shortcut"
              onClick={() => setShowStoredPrompts(true)}
            >
              <span slot="icon"><CurlyBracesIcon /></span>
            </sp-action-button>
            <sp-action-button
              class="iconButton"
              title="Save prompt as a shortcut"
              onClick={onStorePrompt}
            >
              <span slot="icon"><SaveIcon /></span>
            </sp-action-button>
          </div>
        </div>
      )}
    </>
  );
}


export const PromptControls = (
  {
    prompt,
    onPromptChange,
    negativePrompt,
    onNegativePromptChange,
    storedPrompts,
    onStoredPromptsChange,
  }
) => {

  return (
    <>
      <PromptControl
        placeholder="Prompt (what to dream)"
        prompt={prompt}
        onPromptChange={onPromptChange}
        storedPrompts={storedPrompts}
        onStoredPromptsChange={onStoredPromptsChange}
      />
      <PromptControl
        placeholder="Negative prompt (what to avoid dreaming)"
        prompt={negativePrompt}
        onPromptChange={onNegativePromptChange}
        storedPrompts={storedPrompts}
        onStoredPromptsChange={onStoredPromptsChange}
      />
    </>
  );
}
