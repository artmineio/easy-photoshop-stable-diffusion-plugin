import React, {useContext} from "react";
import {GearIcon} from "../../common/Icons";
import {ModalContext} from "../../../contexts/ModalContext";
import {ModalName} from "../../modals/FullScreenModalSelector";

const {trueOrUndefined} = require ("../../../utils/utils");
const {InferenceType} = require ("../../../utils/Constants");
const {TabGroup, TabItem} = require ("../../common/TabGroup");

export const InferenceTypeSelection = ({ inferenceType, onInferenceTypeChange }) => {
  const {modal, setModal} = useContext(ModalContext);
  // console.log("modal, setModal", modal, setModal)

  const onGearClick = () => {
    setModal({
      modalName: ModalName.SETTINGS,
    })
  }

  return (
    <>
      <TabGroup>
        <TabItem
          fontSize="S"
          value={InferenceType.TXT_2_IMG}
          selected={trueOrUndefined(inferenceType === InferenceType.TXT_2_IMG)}
          onClick={() => onInferenceTypeChange(InferenceType.TXT_2_IMG)}
        >
          {InferenceType.TXT_2_IMG}
        </TabItem>
        <TabItem
          fontSize="S"
          value={InferenceType.IMG_2_IMG}
          selected={trueOrUndefined(inferenceType === InferenceType.IMG_2_IMG)}
          onClick={() => onInferenceTypeChange(InferenceType.IMG_2_IMG)}
        >
          {InferenceType.IMG_2_IMG}
        </TabItem>
        <TabItem
          fontSize="S"
          value={InferenceType.INPAINT}
          selected={trueOrUndefined(inferenceType === InferenceType.INPAINT)}
          onClick={() => onInferenceTypeChange(InferenceType.INPAINT)}
        >
          {InferenceType.INPAINT}
        </TabItem>
        <sp-action-button
          class="settingsButton"
          onClick={onGearClick}
        >
          <span slot="icon"><GearIcon /></span>
        </sp-action-button>
      </TabGroup>
    </>
  );
}
