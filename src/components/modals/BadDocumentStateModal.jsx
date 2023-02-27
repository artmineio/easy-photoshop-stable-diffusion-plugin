import {Space2, Space3, Space4} from "../common/Spaces";
import {useContext} from "react";
import {AlertContext} from "../../contexts/AlertContext";
import {photoshopApp} from "../../photoshop/PhotoshopApp";

const React = require('react');
const {ModalContext} = require("../../contexts/ModalContext")

export const BadDocumentStateModal = () => {
  const modalContext = useContext(ModalContext);
  const alertContext = useContext(AlertContext);

  const checkIfActiveDocumentAvailable = async () => {
    if (!photoshopApp.hasActiveDocument()) {
      alertContext.setError(<>Cannot find an opened image!</>)
      return;
    }

    modalContext.setModal({
      modalName: null,
    });
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
                Please open at least one image to use this plugin! Please click "Try again" once you do
              </sp-body>
            </div>
          </div>
        </div>

        <Space4/>

        <div className="container flexRow justifyContentCenter">
          <Space2/>
          <sp-button
            class="settingsModalButton"
            variant="cta"
            onClick={checkIfActiveDocumentAvailable}
          >Try again
          </sp-button>
          <Space2/>
        </div>
      </div>
    </>
  );
}
