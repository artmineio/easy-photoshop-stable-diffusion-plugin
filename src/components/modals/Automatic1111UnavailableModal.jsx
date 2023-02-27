import {Space2, Space3, Space4} from "../common/Spaces";
import {useContext, useEffect, useState} from "react";
import {AlertContext} from "../../contexts/AlertContext";

const React = require('react');
const {ModalContext} = require("../../contexts/ModalContext")
const {localServerApi} = require("../../api/localServerApi");

const AUTOMATIC1111_URL_SETTING = "automatic1111_url";

// TODO: part of the functionality is shared with SettingsModal, consider extracting
export const Automatic1111UnavailableModal = () => {
  const [automatic1111Url, setAutomatic1111Url] = useState(null);
  const modalContext = useContext(ModalContext);
  const alertContext = useContext(AlertContext);

  const loadAutomatic1111Url = async () => {
    const backendSettings = await localServerApi.getSettings();
    setAutomatic1111Url(backendSettings[AUTOMATIC1111_URL_SETTING]);
    await checkAutomatic1111ReachableAndMaybeClose();
  }

  useEffect(() => {
    loadAutomatic1111Url();
  }, [])

  const checkAutomatic1111ReachableAndMaybeClose = async () => {
    try {
      const isReachable = await localServerApi.isLocalServerAndAutomatic1111Reachable()
      if (!isReachable.isAutomatic1111Reachable) {
        // Still unreachable
        if (automatic1111Url) {
          alertContext.setError(<>Cannot connect to {automatic1111Url}</>)
        }
        return
      }

      // All is good, return to main menu
      modalContext.setModal({
        modalName: null,
      });
    } catch (e) {
      // Local server should be reachable, but in case not, let's display the error
      alertContext.setError(<>{e.message}</>)
    }
  }

  const updateAutomatic1111Url = async () => {
    try {
      await localServerApi.updateSetting(AUTOMATIC1111_URL_SETTING, automatic1111Url)
      await checkAutomatic1111ReachableAndMaybeClose();
    } catch (e) {
      alertContext.setError(<>{e.message}</>)
    }
  }

  return (
    <>
      <div className="settingsModalContainer">
        <div className="container flexColumn">
          <div className="container flexRow justifyContentCenter">
            <sp-body size="L" className="storedPromptKeyBrace">Settings</sp-body>
          </div>
          <sp-divider size="medium"></sp-divider>
          <Space3/>

          <div className="container flexRow errorBanner">
            <sp-icon size="xxs" name="ui:AlertMedium" class="errorIcon"></sp-icon>
            <Space2/>
            <div>
              <sp-body size="S">
                Cannot reach Automatic1111 URL at:
              </sp-body>
              <sp-body size="S">
                {automatic1111Url}
              </sp-body>
              <sp-body size="S">
                Please make sure you check out the
                Automatic1111 repo locally at https://github.com/AUTOMATIC1111/stable-diffusion-webui.
                Then make sure to run it in the API mode:
              </sp-body>
              <sp-body size="S" class="fontStyleCode">
                COMMANDLINE_ARGS=--api
              </sp-body>
              <sp-body size="S">
                If you have a different Automatic1111 URL from the one above, feel free to update it here:
              </sp-body>
            </div>
          </div>
          <Space3/>

          <div className="container flexRow">
            <sp-textfield
              class="automatic1111UrlTextField"
              placeholder="e.g. http://127.0.0.1:7860/"
              onInput={(e) => setAutomatic1111Url(e.target.value)}
              value={automatic1111Url}
            >
              <sp-label slot="label">Automatic1111 URL</sp-label>
            </sp-textfield>
          </div>
        </div>

        <Space4/>

        <div className="container flexRow justifyContentCenter">
          <Space2/>
          <sp-button
            class="settingsModalButton"
            variant="cta"
            onClick={updateAutomatic1111Url}
          >Update
          </sp-button>
          <Space2/>
          <sp-button
            class="settingsModalButton"
            variant="primary"
            onClick={checkAutomatic1111ReachableAndMaybeClose}
          >Try again
          </sp-button>
          <Space2/>
        </div>
      </div>
    </>
  );
}
