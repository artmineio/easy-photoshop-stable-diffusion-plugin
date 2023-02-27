import React from "react";
import {HowToBanner} from "./HowToBanner";

const {InferenceType} = require("../../../utils/Constants");
const {Space2} = require("../../common/Spaces");

export const InstructionsBanner = ({
  inferenceType,
  showTxt2ImgInstructions,
  onShowTxt2ImgInstructionsChange,
  showImg2ImgInstructions,
  onShowImg2ImgInstructionsChange,
  showInpaintInstructions,
  onShowInpaintInstructionsChange,
}) => {
  return (
    <div className="container flexRow instructionsBanner">
      <sp-icon size="xxs" name="ui:InfoMedium" class="instructionsIcon"></sp-icon>
      <Space2 />
      {inferenceType === InferenceType.TXT_2_IMG ? (
        <HowToBanner
          isExpanded={showTxt2ImgInstructions}
          onIsExpandedChange={onShowTxt2ImgInstructionsChange}
        >
          <>
            Type a prompt (what to draw), negative prompt (what not to draw).
            Then pick the Rectangular Marquee tool and select a region of the document where the AI generated image
            should be placed; otherwise the image would be generated on the full document canvas. Then click 'Dream'
          </>
        </HowToBanner>
      ) : undefined}
      {inferenceType === InferenceType.IMG_2_IMG ? (
        <HowToBanner
          isExpanded={showImg2ImgInstructions}
          onIsExpandedChange={onShowImg2ImgInstructionsChange}
        >
          <>
            Make sure the source layer you want to modify is selected in the layer dropdown. Then use the Rectangular
            Marquee tool to select a portion of the layer that would be used; otherwise the full layer canvas would be
            fed to the AI. Don't forget to provide the prompt and click 'Dream'
          </>
        </HowToBanner>
      ) : undefined}
      {inferenceType === InferenceType.INPAINT ? (
        <HowToBanner
          isExpanded={showInpaintInstructions}
          onIsExpandedChange={onShowInpaintInstructionsChange}
        >
          <>
            Make sure the source layer you want to modify is selected in the layer dropdown.
            Then click 'New Mask Layer' and a new layer would be created.
            Whatever you paint on the layer would be used to determine which pixels on the source layer are
            replaced by the AI. Don't forget to provide the prompt and click 'Dream'.
          </>
          <>
            If you want to specify which region of the image to feed to the AI, use the Rectangular Marquee tool,
            otherwise the area containing the painted mask would be used with some padding.
          </>
          <>
            If you have multiple mask layers, the most recently created among the visible mask layers
            would be used as a mask.
          </>
        </HowToBanner>
      ) : undefined}
    </div>
  );
}
