import React from "react";

export const TabItem = ({ value, selected, onClick, fontSize }) => {
  const selectedClassName = selected ? " selected" : ""
  const sizeClassName = fontSize === "S" ? " small" : ""
  return (
    <div
      className={`tabItem${selectedClassName}${sizeClassName}`}
      onClick={onClick}
    >
      <sp-body size={fontSize}>{value}</sp-body>
    </div>
  );
}

export const TabGroup = ({ children }) => {
  return (
    <div className="container flexRow tabGroup">
      {children}
    </div>
  );
}
