import React, {useState} from "react";

import {InfoIcon} from "./InfoIcon";

export const InfoIconWithTooltip = ({ children, marginTop }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  const onMouseEnter = () => {
    setIsTooltipVisible(true);
  }
  const onMouseLeave = () => {
    setIsTooltipVisible(false);
  }

  return (
    <>
      <div
        style={{ marginTop: marginTop ?? 0 }}
        className="tooltipOverlayContainer"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div
          className="tooltipOverlay"
          style={{ display: isTooltipVisible ? "inline" : "none" }}
        >
          {children}
        </div>
        <InfoIcon />
      </div>
    </>
  );
}
