import {Space2, Space3, Space4} from "../common/Spaces";
import {useContext} from "react";
import {isWindowsPlatform} from "../../utils/osUtils";
import {localServerApi} from "../../api/localServerApi";
import {ModalName} from "./FullScreenModalSelector";

const React = require('react');
const {ModalContext} = require("../../contexts/ModalContext")

export const LocalServerUnavailableModal  = () => {
  const modalContext = useContext(ModalContext);

  const checkLocalServerAndAutomatic1111Reachable = async () => {
    const isReachable = await localServerApi.isLocalServerAndAutomatic1111Reachable()
    if (!isReachable.isLocalServerReachable) {
      // Still unreachable
      return
    }

    if (!isReachable.isAutomatic1111Reachable) {
      // Server is now reachable but Automatic1111 is not
      modalContext.setModal({
        modalName: ModalName.AUTOMATIC1111_UNAVAILABLE,
      });
      return
    }

    // All is good, return to main menu
    modalContext.setModal({
      modalName: null,
    });
  }

  const localServerStartScript = isWindowsPlatform()
    ? "start_server.bat"
    : "./start_server.sh"
  return (
    <>
      <div className="settingsModalContainer">
        <div className="container flexColumn">
          <div className="container flexRow justifyContentCenter">
            <sp-body size="L">Error</sp-body>
          </div>
          <sp-divider size="medium"></sp-divider>
          <Space3/>

          <div className="container flexRow errorBanner">
            <sp-icon size="xxs" name="ui:AlertMedium" class="errorIcon"></sp-icon>
            <Space2/>
            <div>
              <sp-body size="S">
                Cannot reach local server at http://localhost:8088/. Please make sure
                to run the following script in the plugin folder:
              </sp-body>
              <sp-body size="S" class="fontStyleCode">
                {localServerStartScript}
              </sp-body>
              <sp-body size="S">
                Please click "Try again" once you do!
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
            onClick={checkLocalServerAndAutomatic1111Reachable}
          >Try again
          </sp-button>
          <Space2/>
        </div>
      </div>
    </>
  );
}
