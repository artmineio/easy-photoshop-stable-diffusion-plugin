import React from "react";

import "./styles.css";
import {PanelController} from "./controllers/PanelController.jsx";
import {MainPanel} from "./panels/MainPanel.jsx";

import {entrypoints} from "uxp";
import {ModalContext, ModalContextProvider} from "./contexts/ModalContext";
import {AlertContextProvider} from "./contexts/AlertContext";

const mainPanelController = new PanelController(() => (
  <AlertContextProvider>
    <ModalContextProvider>
      <MainPanel/>
    </ModalContextProvider>
  </AlertContextProvider>
), {
  id: "mainPanel",
  menuItems: [
    {
      id: "stableDiffusion",
      label: "Stable Diffusion Plugin",
      enabled: true,
      checked: false,
      oninvoke: () => location.reload()
    }
  ]
});

entrypoints.setup({
  panels: {
    mainPanel: mainPanelController
  }
});
