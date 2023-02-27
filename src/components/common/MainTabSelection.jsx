import React from "react";
import {trueOrUndefined} from "../../utils/utils";
import {TabGroup, TabItem} from "./TabGroup";

export const MainTab = Object.freeze({
  DREAM: "Dream",
  RESULTS: "Results",
  PROMPTS: "Prompts",
});

export const MainTabSelection = ({ currentTab, onCurrentTabChange }) => {
  return (
    <>
      <TabGroup>
        <TabItem
          fontSize="M"
          value={MainTab.DREAM}
          selected={trueOrUndefined(currentTab === MainTab.DREAM)}
          onClick={() => onCurrentTabChange(MainTab.DREAM)}
        >
          {MainTab.DREAM}
        </TabItem>
        <TabItem
          fontSize="M"
          value={MainTab.RESULTS}
          selected={trueOrUndefined(currentTab === MainTab.RESULTS)}
          onClick={() => onCurrentTabChange(MainTab.RESULTS)}
        >
          {MainTab.RESULTS}
        </TabItem>
        <TabItem
          fontSize="M"
          value={MainTab.PROMPTS}
          selected={trueOrUndefined(currentTab === MainTab.PROMPTS)}
          onClick={() => onCurrentTabChange(MainTab.PROMPTS)}
        >
          {MainTab.PROMPTS}
        </TabItem>
      </TabGroup>
    </>
  );
}
