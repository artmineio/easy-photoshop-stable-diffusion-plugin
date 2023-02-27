const {UiError} = require("../exceptions/Exceptions");

const photoshop = require('photoshop')
const uxp = require('uxp')

const {executeAsModal} = photoshop.core;
const {batchPlay} = photoshop.action;
const {app} = photoshop;
const fs = uxp.storage.localFileSystem;

// photoshop.action.addNotificationListener(['all'], (event, descriptor) => {
//   console.log("Event:" + event + " Descriptor: " + JSON.stringify(descriptor))
// });

// Any layer with this prefix is considered to be a mask layer
// This is convenient because user can duplicate a Mask Layer, and get Mask Layer Copy that will also be a mask layer
const MASK_LAYER_NAME_PREFIX = "Mask Layer"

export class PhotoshopApp {
  maskLayerCounter;

  constructor() {
    this.maskLayerCounter = 1
  }

  hasActiveDocument = () => {
    return !!app.activeDocument
  }

  showAlert = (message) => {
    app.showAlert(message);
  }

  getActiveDocument = () => {
    return app.activeDocument;
  }

  getActiveLayer = () => {
    let activeLayers = app.activeDocument.activeLayers
    return activeLayers[0]
  }

  setForegroundColor = async (red, green, blue) => {
    try {
      await executeAsModal(async () => {
        const color = new app.SolidColor();
        color.rgb.red = red;
        color.rgb.green = green;
        color.rgb.blue = blue
        app.foregroundColor = color
      })
    } catch (e) {
      console.error(e);
    }
  }

  pickTool = async (toolName) => {
    await executeAsModal(async () => {
      return await batchPlay(
        [
          {
            _obj: 'select',
            "_target": [{"_ref": toolName}],
          }
        ],
        {
          // synchronousExecution: true,
          modalBehavior: 'execute'
        }
      )
    })
  }

  maybeGetLayerById = (layerId) => {
    const layers = app.activeDocument.layers;
    return layers.find(l => l._id === layerId);
  }

  getAllLayers = () => {
    return app.activeDocument.layers;
  }

  getVisibleLayers = () => {
    return app.activeDocument.layers.filter(layer => layer.visible);
  }

  getLayerById = (layerId) => {
    const layer = this.maybeGetLayerById(layerId)
    if (!layer) {
      console.error(`Could not find layer with id ${layerId}`)
      throw new UiError(
        "Something went wrong. Please make sure you are following the right steps when doing image generation. " +
        "Otherwise please contact the developer."
      )
    }
    return layer
  }

  checkLayerExists = (layerId) => {
    this.getLayerById(layerId)
  }

  createLayer = async (layerName = null) => {
    const command = {
      "_obj": "make",
      "_target": [{"_ref": "layer"}],
    }
    if (layerName) {
      command["using"] = {"_obj": "layer", "name": layerName}
    }
    const result = await executeAsModal(async () => {
      return await batchPlay(
        [
          command,
        ],
        {
          // synchronousExecution: true,
          modalBehavior: 'execute'
        }
      )
    })
    const layerId = result[0].layerID;
    // checkLayerExists(layerId);
    return layerId;
  }

  createMaskLayer = async () => {
    const layerName = `${MASK_LAYER_NAME_PREFIX} ${this.maskLayerCounter++}`;
    await this.createLayer(layerName);
    return layerName;
  }

  isMaskLayer = (layer) => {
    return layer.name.startsWith(MASK_LAYER_NAME_PREFIX);
  }

  clearMaskLayers = async () => {
    const maskLayers = this.getMaskLayers()
    for (let maskLayer of maskLayers) {
      await this.deleteLayer(maskLayer._id)
      // await new Promise(r => setTimeout(r, 2000));
    }
  }

  getMaskLayers = () => {
    // Anything that starts with MASK_LAYER_NAME_PREFIX is considered a mask layer
    const layers = app.activeDocument.layers;
    return layers.filter(this.isMaskLayer)
  }

  getLatestVisibleMaskLayer = () => {
    const maskLayers = this.getMaskLayers()
    const visibleMaskLayerIds = maskLayers
      .filter(layer => layer.visible)
      .map(layer => layer._id)

    if (visibleMaskLayerIds.length === 0) {
      throw new UiError(
        "No visible mask layers found! Please make sure to use 'New Mask Layer' button to create " +
        "some mask layers"
      );
    }
    const mostRecentlyCreatedVisibleMaskLayerId = Math.max(...visibleMaskLayerIds)
    const maskLayer = this.getLayerById(mostRecentlyCreatedVisibleMaskLayerId);
    return maskLayer
  }

  getTopVisibleLayerId = () => {
    const visibleLayerIds = app.activeDocument.layers
      .filter(layer => layer.visible)
      .map(layer => layer._id)
    return visibleLayerIds.length >= 1
      ? visibleLayerIds[0]
      : null;
  }

  deleteLayer = async (layerId) => {
    await executeAsModal(async () => {
      return await batchPlay(
        [
          {
            "_obj": "delete",
            _target: {_ref: 'layer', _id: layerId},
          },
        ],
        {
          synchronousExecution: true,
          modalBehavior: 'execute'
        }
      )
    })
  }

  getSelectionArea = async () => {
    const result = await executeAsModal(async () => {
      return await batchPlay(
        [
          {
            _obj: 'get',
            _target: [
              {
                _property: 'selection'
              },
              {
                _ref: 'document',
                _id: app.activeDocument._id
              }
            ],
            _options: {
              dialogOptions: 'dontDisplay'
            }
          }
        ],
        {
          synchronousExecution: false,
          modalBehavior: 'execute'
        }
      )
    })
    const selection = result[0]?.selection
    if (!selection) {
      return null
    }
    return {
      x: selection.left._value,
      y: selection.top._value,
      width: selection.right._value - selection.left._value,
      height: selection.bottom._value - selection.top._value,
    }
  }

  getLayerBounds = (layer) => {
    return {
      x: layer.bounds.left,
      y: layer.bounds.top,
      width: layer.bounds.right - layer.bounds.left,
      height: layer.bounds.bottom - layer.bounds.top,
    }
  }

  applySelectionArea = async (selectionArea) => {
    await executeAsModal(async () => {
      await batchPlay(
        [
          {
            _obj: 'set',
            "_target": [{"_ref": "channel", "_property": "selection"}],
            "to": {
              "_obj": "rectangle",
              "left": {"_unit": "pixelsUnit", "_value": selectionArea.x},
              "top": {"_unit": "pixelsUnit", "_value": selectionArea.y},
              "right": {"_unit": "pixelsUnit", "_value": selectionArea.x + selectionArea.width},
              "bottom": {"_unit": "pixelsUnit", "_value": selectionArea.y + selectionArea.height},
            },
          }
        ],
        {
          // synchronousExecution: true,
          modalBehavior: 'execute'
        }
      )
    })
  }

  applyFullDocumentSelection = async () => {
    await executeAsModal(async () => {
      await batchPlay(
        [
          {
            _obj: 'set',
            "_target": [{"_ref": "channel", "_property": "selection"}],
            "to":{"_enum":"ordinal","_value":"allEnum"}
          }
        ],
        {
          // synchronousExecution: true,
          modalBehavior: 'execute'
        }
      )
    })
  }

  applyLayerMinimalSelectionArea = async (layerId) => {
    // checkLayerExists(layerId);
    await executeAsModal(async () => {
      await batchPlay(
        [
          {
            "_obj": "set",
            "_target": [{"_ref": "channel", "_property": "selection"}],
            "to": {
              "_ref": [
                {"_ref": "channel", "_enum": "channel", "_value": "transparencyEnum"},
                {"_ref": "layer", "id": layerId}
              ]
            }
          },
        ],
        {
          // synchronousExecution: true,
          modalBehavior: 'execute'
        }
      )
    })
  }

  activateLayer = async (layerId) => {
    // checkLayerExists(layerId)
    await executeAsModal(async () => {
      return await batchPlay(
        [
          {
            _obj: 'select',
            _target: {_ref: 'layer', _id: layerId},
            "makeVisible": false,
          }
        ],
        {
          synchronousExecution: true,
          modalBehavior: 'execute'
        }
      )
    })
  }

  renameLayer = async (layerId, newLayerName) => {
    // checkLayerExists(layerId)
    await executeAsModal(async () => {
      return await batchPlay(
        [
          {
            _obj: 'set',
            _target: {_ref: 'layer', _id: layerId},
            to: {_obj: "layer", name: newLayerName},
            // "makeVisible": false,
          }
        ],
        {
          // synchronousExecution: true,
          modalBehavior: 'execute'
        }
      )
    })
  }

  changeBackgroundToLayer = async () => {
    return await executeAsModal(async () => {
      const result = await batchPlay(
        [
          {
            _obj: 'set',
            "_target": [
              {"_ref": "layer", "_property": "background"}
            ],
            "to": {
              "_obj": "layer",
              "opacity": {"_unit": "percentUnit", "_value": 100},
              "mode": {"_enum": "blendMode", "_value": "normal"},
            },
          }
        ],
        {
          // synchronousExecution: true,
          modalBehavior: 'execute'
        }
      )
      return result[0].layerID
    })
  }

  duplicateLayer = async (layerId, layerName) => {
    return await executeAsModal(async () => {
      const result = await batchPlay(
        [
          {
            _obj: 'duplicate',
            "_target": [
              {_ref: 'layer', _id: layerId},
            ],
            "name": layerName,
          }
        ],
        {
          // synchronousExecution: true,
          modalBehavior: 'execute'
        }
      )
      return result[0].ID[0]
    })
  }

  maybeChangeBackgroundToLayer = async (layerId) => {
    const backgroundLayerId = app.activeDocument.backgroundLayer?._id
    if (backgroundLayerId !== layerId) {
      return layerId;
    }
    const newLayerId = await this.changeBackgroundToLayer()
    await this.renameLayer(newLayerId, "Background")
    return newLayerId;
  }

  isBackgroundLayer = (layerId) => {
    return layerId === app.activeDocument.backgroundLayer?._id
  }

  getExportFolder = async () => {
    // return fs.getTemporaryFolder();
    return (await fs.getPluginFolder()).getEntry(`output`)
  }

  getImportFolder = async () => {
    // return fs.getTemporaryFolder();
    // TODO: use temporary folder
    return (await fs.getPluginFolder()).getEntry(`output`)
  }

  saveLayerAsImage = async (layer, fileNameWithoutExtension, fileType) => {
    await this.activateLayer(layer._id)
    const oldLayerName = layer.name
    const shouldRenameLayer = oldLayerName !== fileNameWithoutExtension;
    if (shouldRenameLayer) {
      await this.renameLayer(layer._id, fileNameWithoutExtension)
    }

    const exportFolder = await this.getExportFolder()
    const exportFolderPath = exportFolder.nativePath;
    const quality = fileType === "png" ? 32 : 80
    try {
      await executeAsModal(async () => {
        await batchPlay(
          [
            {
              _obj: 'exportSelectionAsFileTypePressed',
              _target: {_ref: 'layer', _enum: 'ordinal', _value: 'targetEnum', _id: layer._id},
              fileType,
              quality,
              metadata: 0,
              destFolder: exportFolderPath,
              sRGB: true,
              openWindow: false,
              _options: {dialogOptions: 'dontDisplay'}
            }
          ],
          {
            modalBehavior: 'execute'
          }
        )
      })
      return `${exportFolderPath}/${fileNameWithoutExtension}.${fileType}`;
    } catch (e) {
      console.error("Failed to export image", e)
      throw new UiError(`Cannot export layer "${oldLayerName}" as an image. Perhaps something is wrong with permissions? Please contact the developer`)
    } finally {
      // Rename layer to the original name but give Photoshop some time to save the file
      await new Promise(resolve => setTimeout(resolve, 3000))
      if (shouldRenameLayer) {
        await this.renameLayer(layer._id, oldLayerName)
      }
    }
  }

  saveLayerOrBackgroundAsImage = async (layer, fileNameWithoutExtension, fileType) => {
    if (!this.isBackgroundLayer(layer._id)) {
      return this.saveLayerAsImage(layer, fileNameWithoutExtension, fileType)
    }

    const layerCopyId = await this.duplicateLayer(layer._id, fileNameWithoutExtension)
    try {
      const layerCopy = this.getLayerById(layerCopyId)
      return this.saveLayerAsImage(layerCopy, fileNameWithoutExtension, fileType)
    } catch (e) {
      console.error("Failed to export image", e)
      // throw new Error(`Cannot export layer "${oldLayerName}" as an image. Perhaps something is wrong with permissions? Please contact the developer`)
    } finally {
      // Rename layer to the original name but give Photoshop some time to save the file
      await new Promise(resolve => setTimeout(resolve, 3000))
      await this.deleteLayer(layerCopyId)
    }
  }

  openImageAsDocument = async (fileNameWithoutPath) => {
    const importFolder = await this.getImportFolder();
    let imageFileEntry = await importFolder.getEntry(`./${fileNameWithoutPath}`)
    await executeAsModal(async () => {
      try {
        await app.open(imageFileEntry)
      } catch (e) {
        console.error(`Could not open image ${fileNameWithoutPath}`, e)
        throw UiError("Could not fetch generated images. Perhaps something is wrong with Stable Diffusion? Please contact the developer")
      }
    })
  }

  openImageAsLayerInDocument = async (documentId, newLayerName, fileNameWithoutPath) => {
    const existingDocumentIds = app.documents.map(doc => doc._id)
    const sourceDocument = app.documents.find(doc => doc._id === documentId)

    // Open the image as a document
    await this.openImageAsDocument(fileNameWithoutPath)

    // Find the new document
    const newDocument = app.documents.filter(doc => !existingDocumentIds.includes(doc._id))[0]

    await executeAsModal(() => {
      // The newly opened document should only have a single layer imported as file
      newDocument.layers[0].name = newLayerName
      newDocument.layers[0].duplicate(sourceDocument)
      newDocument.closeWithoutSaving()
    })
  }

  openImageAsLayerInActiveDocument = async (newLayerName, fileNameWithoutPath) => {
    const activeDocument = this.getActiveDocument()
    await this.openImageAsLayerInDocument(activeDocument._id, newLayerName, fileNameWithoutPath)
  }

}

export const photoshopApp = new PhotoshopApp();
