import React, {useState} from "react";

const {DiceIcon} = require("../../common/Icons");
const {trueOrUndefined} = require("../../../utils/utils");
const {InfoIconWithTooltip} = require("../../common/InfoIconWithTooltip");

export const SeedCheckboxAndInput = ({ seed, onSeedChange }) => {
  const [isRandomSeedChecked, setIsRandomSeedChecked] = useState(seed === -1)
  const [isInvalid, setIsInvalid] = useState(false)

  const onDiceButtonClicked = () => {
    setIsRandomSeedChecked(true)
    // Random seed is `-1`
    onSeedChange(-1)
  }

  const onCheckboxClicked = () => {
    setIsRandomSeedChecked(false)
  }

  const onSeedChanged = (event) => {
    const parsedSeed = parseInt(event.target.value);
    const isValueValid = !isNaN(parsedSeed) && Number.isInteger(parsedSeed) && (parsedSeed === -1 || parsedSeed > 0)
    setIsInvalid(!isValueValid)
    if (isValueValid) {
      // Only update seed when it's valid. We might be able to do some fixes, e.g. change float to int
      // However, apparently UXP is not very good with react and it does not update entered value
      // based on the state. So you can't really control what the user enters it would seem
      onSeedChange(parsedSeed)
    }
  }

  return (
    <div className="container flexRow">
      {isRandomSeedChecked ? (
        <sp-checkbox
          onClick={onCheckboxClicked}
          checked={true}
        >
          Random seed
        </sp-checkbox>
      ) : (
        <>
          <sp-textfield
            class="seedTextField"
            placeholder="Seed"
            invalid={trueOrUndefined(isInvalid)}
            onInput={onSeedChanged}
            value={seed}
          >
          </sp-textfield>
          <sp-action-button
            class="randomButton"
            title="Choose seed randomly"
            onClick={onDiceButtonClicked}
          >
            <span slot="icon"><DiceIcon /></span>
          </sp-action-button>
        </>
      )}
      <InfoIconWithTooltip>
        <div>seed controls randomness, same seed leads to same results</div>
      </InfoIconWithTooltip>
    </div>
  );
}
