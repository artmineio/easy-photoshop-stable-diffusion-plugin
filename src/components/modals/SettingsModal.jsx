import {Space2, Space3, Space4} from "../common/Spaces";
import {useContext, useEffect, useState} from "react";
import {BadRequestError} from "../../exceptions/Exceptions";
import {AlertContext} from "../../contexts/AlertContext";

const React = require('react');
const {ModalContext} = require("../../contexts/ModalContext")
const {localServerApi} = require("../../api/localServerApi");

const AUTOMATIC1111_URL_SETTING = "automatic1111_url";

export const SettingsModal = () => {
  const [automatic1111Url, setAutomatic1111Url] = useState(null);
  const modalContext = useContext(ModalContext);
  const alertContext = useContext(AlertContext);

  const loadAutomatic1111Url = async () => {
    const backendSettings = await localServerApi.getSettings()
    setAutomatic1111Url(backendSettings[AUTOMATIC1111_URL_SETTING]);
  }

  useEffect(() => {
    loadAutomatic1111Url();
  }, [])

  const updateAutomatic1111Url = async () => {
    try {
      await localServerApi.updateSetting(AUTOMATIC1111_URL_SETTING, automatic1111Url)
      modalContext.setModal({modalName: null});
    } catch (e) {
      alertContext.setError(<>{e.message}</>)
    }
  }

  const onCancelClick = () => {
    modalContext.setModal({modalName: null});
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
          >Save
          </sp-button>
          <Space2/>
          <sp-button
            class="settingsModalButton"
            variant="primary"
            onClick={onCancelClick}
          >Cancel
          </sp-button>
          <Space2/>
        </div>
      </div>
    </>
  );
}
