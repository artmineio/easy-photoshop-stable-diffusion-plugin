import React from "react";

const HideHowTo = ({ onClick }) => {
  return (
    <sp-link style={{marginLeft: 4}} onClick={onClick}>
      Hide how-to
    </sp-link>
  );
}

const ShowHowTo = ({ onClick }) => {
  return (
    <sp-body size="XS">
      <sp-link onClick={onClick}>
        Show how-to
      </sp-link>
    </sp-body>
  );
}

export const HowToBanner = ({
  isExpanded,
  onIsExpandedChange,
  children,
}) => {
  const paragraphsChildren = React.Children.toArray(children);
  if (paragraphsChildren.length <= 0) {
    return null;
  }
  const allButLastParagraphs = paragraphsChildren.slice(0, paragraphsChildren.length-1)
  const lastParagraph = paragraphsChildren[paragraphsChildren.length-1]
  return (
    <>
      {isExpanded ? (
        <div>
          {allButLastParagraphs.map((paragraph, index) => (
            <sp-body size="XS" key={String(index)}>
              {paragraph}
            </sp-body>
          ))}
          <sp-body size="XS">
            {lastParagraph}
            <HideHowTo onClick={() => onIsExpandedChange(false)}></HideHowTo>
          </sp-body>
        </div>
      ) : (
        <ShowHowTo onClick={() => onIsExpandedChange(true)}></ShowHowTo>
      )}
    </>
  );
}
