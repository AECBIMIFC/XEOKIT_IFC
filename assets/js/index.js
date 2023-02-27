//------------------------------------------------------------------------------------------------------------------
// Import the modules we need for this example
//------------------------------------------------------------------------------------------------------------------

import {
  Viewer,
  XKTLoaderPlugin,
  ContextMenu,
  TreeViewPlugin,
  WebIFCLoaderPlugin,
  FastNavPlugin,
  DistanceMeasurementsPlugin,
  SectionPlanesPlugin
} from "https://cdn.jsdelivr.net/npm/@xeokit/xeokit-sdk/dist/xeokit-sdk.es.min.js";

//------------------------------------------------------------------------------------------------------------------
// Create a Viewer, arrange the camera
//------------------------------------------------------------------------------------------------------------------

const viewer = new Viewer({
  canvasId: "myCanvas",
  transparent: true,
});

viewer.camera.eye = [-2.56, 8.38, 8.27];
viewer.camera.look = [13.44, 3.31, -14.83];
viewer.camera.up = [0.1, 0.98, -0.14];
viewer.camera.project.fov = 45;

viewer.camera.zoom(5);

viewer.scene.xrayMaterial.fill = true;
viewer.scene.xrayMaterial.fillAlpha = 0.1;
viewer.scene.xrayMaterial.fillColor = [0, 0, 0];
viewer.scene.xrayMaterial.edgeAlpha = 0.3;
viewer.scene.xrayMaterial.edgeColor = [0, 0, 0];

viewer.scene.highlightMaterial.fill = true;
viewer.scene.highlightMaterial.edges = true;
viewer.scene.highlightMaterial.fillAlpha = 0.1;
viewer.scene.highlightMaterial.edgeAlpha = 0.1;
viewer.scene.highlightMaterial.edgeColor = [1, 1, 0];

viewer.scene.selectedMaterial.fill = true;
viewer.scene.selectedMaterial.edges = true;
viewer.scene.selectedMaterial.fillAlpha = 0.5;
viewer.scene.selectedMaterial.edgeAlpha = 0.6;
viewer.scene.selectedMaterial.edgeColor = [0, 1, 1];

viewer.scene.sao.enabled = true;
viewer.scene.sao.numSamples = 60;
viewer.scene.sao.kernelRadius = 170;

viewer.cameraControl.followPointer = true;

//----------------------------------------------------------------------------------------------------------------------
// FastNavigation
//----------------------------------------------------------------------------------------------------------------------

// new FastNavPlugin(viewer, {
//   // Don't show edges while we interact (default is true)
//   hideEdges: true,

//   // Don't show ambient shadows (SAO) while we interact (default is true)
//   hideSAO: true,

//   // No physically-based rendering (PBR) while we interact (default is true)
//   hidePBR: true,

//   // Hide transparent objects while we interact (default is false)
//   // We don't care if the windows temporarily dissapear while we move around.
//   hideTransparentObjects: true,

//   // Scale the canvas resolution while we interact (default is false).
//   // This makes the canvas slightly blurry while we're interacting, but
//   // draws 75% less pixels.
//   scaleCanvasResolution: true,

//   // Factor by which we scale canvas when we interact (default is 0.6)
//   scaleCanvasResolutionFactor: 0.5,

//   // When we stop interacting, have a delay before restoring
//   // normal render (default is true)
//   delayBeforeRestore: true,

//   // The delay duration, in seconds (default is 0.5)
//   delayBeforeRestoreSeconds: 0.5,
// });

//----------------------------------------------------------------------------------------------------------------------
// Create a tree view
//----------------------------------------------------------------------------------------------------------------------

const treeView = new TreeViewPlugin(viewer, {
  containerElement: document.getElementById("treeViewContainer"),
  autoExpandDepth: 3,
  hierarchy: "containment",
});

const treeViewContextMenu = new ContextMenu({
  items: [
    [
      {
        title: "View Fit",
        doAction: function (context) {
          const scene = context.viewer.scene;
          const objectIds = [];
          context.treeViewPlugin.withNodeTree(
            context.treeViewNode,
            (treeViewNode) => {
              if (treeViewNode.objectId) {
                objectIds.push(treeViewNode.objectId);
              }
            }
          );
          scene.setObjectsVisible(objectIds, true);
          scene.setObjectsHighlighted(objectIds, true);
          context.viewer.cameraFlight.flyTo(
            {
              projection: "perspective",
              aabb: scene.getAABB(objectIds),
              duration: 0.5,
            },
            () => {
              setTimeout(function () {
                scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
              }, 500);
            }
          );
        },
      },
      {
        title: "View Fit All",
        doAction: function (context) {
          const scene = context.viewer.scene;
          context.viewer.cameraFlight.flyTo({
            projection: "perspective",
            aabb: scene.getAABB({}),
            duration: 0.5,
          });
        },
      },
    ],
    [
      {
        title: "Hide",
        doAction: function (context) {
          context.treeViewPlugin.withNodeTree(
            context.treeViewNode,
            (treeViewNode) => {
              if (treeViewNode.objectId) {
                const entity =
                  context.viewer.scene.objects[treeViewNode.objectId];
                if (entity) {
                  entity.visible = false;
                }
              }
            }
          );
        },
      },
      {
        title: "Hide Others",
        doAction: function (context) {
          const scene = context.viewer.scene;
          scene.setObjectsVisible(scene.visibleObjectIds, false);
          scene.setObjectsXRayed(scene.xrayedObjectIds, false);
          scene.setObjectsSelected(scene.selectedObjectIds, false);
          scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
          context.treeViewPlugin.withNodeTree(
            context.treeViewNode,
            (treeViewNode) => {
              if (treeViewNode.objectId) {
                const entity = scene.objects[treeViewNode.objectId];
                if (entity) {
                  entity.visible = true;
                }
              }
            }
          );
        },
      },
      {
        title: "Hide All",
        getEnabled: function (context) {
          return context.viewer.scene.visibleObjectIds.length > 0;
        },
        doAction: function (context) {
          context.viewer.scene.setObjectsVisible(
            context.viewer.scene.visibleObjectIds,
            false
          );
        },
      },
    ],
    [
      {
        title: "Show",
        doAction: function (context) {
          context.treeViewPlugin.withNodeTree(
            context.treeViewNode,
            (treeViewNode) => {
              if (treeViewNode.objectId) {
                const entity =
                  context.viewer.scene.objects[treeViewNode.objectId];
                if (entity) {
                  entity.visible = true;
                  entity.xrayed = false;
                  entity.selected = false;
                }
              }
            }
          );
        },
      },
      {
        title: "Show Others",
        doAction: function (context) {
          const scene = context.viewer.scene;
          scene.setObjectsVisible(scene.objectIds, true);
          scene.setObjectsXRayed(scene.xrayedObjectIds, false);
          scene.setObjectsSelected(scene.selectedObjectIds, false);
          context.treeViewPlugin.withNodeTree(
            context.treeViewNode,
            (treeViewNode) => {
              if (treeViewNode.objectId) {
                const entity = scene.objects[treeViewNode.objectId];
                if (entity) {
                  entity.visible = false;
                }
              }
            }
          );
        },
      },
      {
        title: "Show All",
        getEnabled: function (context) {
          const scene = context.viewer.scene;
          return scene.numVisibleObjects < scene.numObjects;
        },
        doAction: function (context) {
          const scene = context.viewer.scene;
          scene.setObjectsVisible(scene.objectIds, true);
          scene.setObjectsXRayed(scene.xrayedObjectIds, false);
          scene.setObjectsSelected(scene.selectedObjectIds, false);
        },
      },
    ],
    [
      {
        title: "X-Ray",
        doAction: function (context) {
          context.treeViewPlugin.withNodeTree(
            context.treeViewNode,
            (treeViewNode) => {
              if (treeViewNode.objectId) {
                const entity =
                  context.viewer.scene.objects[treeViewNode.objectId];
                if (entity) {
                  entity.xrayed = true;
                  entity.visible = true;
                }
              }
            }
          );
        },
      },
      {
        title: "Undo X-Ray",
        doAction: function (context) {
          context.treeViewPlugin.withNodeTree(
            context.treeViewNode,
            (treeViewNode) => {
              if (treeViewNode.objectId) {
                const entity =
                  context.viewer.scene.objects[treeViewNode.objectId];
                if (entity) {
                  entity.xrayed = false;
                }
              }
            }
          );
        },
      },
      {
        title: "X-Ray Others",
        doAction: function (context) {
          const scene = context.viewer.scene;
          scene.setObjectsVisible(scene.objectIds, true);
          scene.setObjectsXRayed(scene.objectIds, true);
          scene.setObjectsSelected(scene.selectedObjectIds, false);
          scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
          context.treeViewPlugin.withNodeTree(
            context.treeViewNode,
            (treeViewNode) => {
              if (treeViewNode.objectId) {
                const entity = scene.objects[treeViewNode.objectId];
                if (entity) {
                  entity.xrayed = false;
                }
              }
            }
          );
        },
      },
      {
        title: "Reset X-Ray",
        getEnabled: function (context) {
          return context.viewer.scene.numXRayedObjects > 0;
        },
        doAction: function (context) {
          context.viewer.scene.setObjectsXRayed(
            context.viewer.scene.xrayedObjectIds,
            false
          );
        },
      },
    ],
    [
      {
        title: "Select",
        doAction: function (context) {
          context.treeViewPlugin.withNodeTree(
            context.treeViewNode,
            (treeViewNode) => {
              if (treeViewNode.objectId) {
                const entity =
                  context.viewer.scene.objects[treeViewNode.objectId];
                if (entity) {
                  entity.selected = true;
                  entity.visible = true;
                }
              }
            }
          );
        },
      },
      {
        title: "Deselect",
        doAction: function (context) {
          context.treeViewPlugin.withNodeTree(
            context.treeViewNode,
            (treeViewNode) => {
              if (treeViewNode.objectId) {
                const entity =
                  context.viewer.scene.objects[treeViewNode.objectId];
                if (entity) {
                  entity.selected = false;
                }
              }
            }
          );
        },
      },
      {
        title: "Clear Selection",
        getEnabled: function (context) {
          return context.viewer.scene.numSelectedObjects > 0;
        },
        doAction: function (context) {
          context.viewer.scene.setObjectsSelected(
            context.viewer.scene.selectedObjectIds,
            false
          );
        },
      },
    ],
  ],
});

// Right-clicking on a tree node shows the context menu for that node

treeView.on("contextmenu", (e) => {
  treeViewContextMenu.context = {
    // Must set context before opening menu
    viewer: e.viewer,
    treeViewPlugin: e.treeViewPlugin,
    treeViewNode: e.treeViewNode,
    entity: e.viewer.scene.objects[e.treeViewNode.objectId], // Only defined if tree node is a leaf node
  };

  treeViewContextMenu.show(e.event.pageX, e.event.pageY);
});

// Left-clicking on a tree node isolates that object in the 3D view

treeView.on("nodeTitleClicked", (e) => {
  const scene = viewer.scene;
  const objectIds = [];
  e.treeViewPlugin.withNodeTree(e.treeViewNode, (treeViewNode) => {
    if (treeViewNode.objectId) {
      objectIds.push(treeViewNode.objectId);
    }
  });
  e.treeViewPlugin.unShowNode();
  scene.setObjectsXRayed(scene.objectIds, true);
  scene.setObjectsVisible(scene.objectIds, true);
  scene.setObjectsXRayed(objectIds, false);
  viewer.cameraFlight.flyTo(
    {
      aabb: scene.getAABB(objectIds),
      duration: 0.5,
    },
    () => {
      setTimeout(function () {
        scene.setObjectsVisible(scene.xrayedObjectIds, false);
        scene.setObjectsXRayed(scene.xrayedObjectIds, false);
      }, 500);
    }
  );
});

//------------------------------------------------------------------------------------------------------------------
// Create two ContextMenus - one for right-click on empty space, the other for right-click on an Entity
//------------------------------------------------------------------------------------------------------------------

const canvasContextMenu = new ContextMenu({
  enabled: true,
  context: {
    viewer: viewer,
  },
  items: [
    [
      {
        title: "Hide All",
        getEnabled: function (context) {
          return context.viewer.scene.numVisibleObjects > 0;
        },
        doAction: function (context) {
          context.viewer.scene.setObjectsVisible(
            context.viewer.scene.visibleObjectIds,
            false
          );
        },
      },
      {
        title: "Show All",
        getEnabled: function (context) {
          const scene = context.viewer.scene;
          return scene.numVisibleObjects < scene.numObjects;
        },
        doAction: function (context) {
          const scene = context.viewer.scene;
          scene.setObjectsVisible(scene.objectIds, true);
          scene.setObjectsXRayed(scene.xrayedObjectIds, false);
          scene.setObjectsSelected(scene.selectedObjectIds, false);
        },
      },
    ],
    [
      {
        title: "View Fit All",
        doAction: function (context) {
          context.viewer.cameraFlight.flyTo({
            aabb: context.viewer.scene.getAABB(),
          });
        },
      },
    ],
  ],
});

const objectContextMenu = new ContextMenu({
  items: [
    [
      {
        title: "View Fit",
        doAction: function (context) {
          const viewer = context.viewer;
          const scene = viewer.scene;
          const entity = context.entity;
          viewer.cameraFlight.flyTo(
            {
              aabb: entity.aabb,
              duration: 0.5,
            },
            () => {
              setTimeout(function () {
                scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
              }, 500);
            }
          );
        },
      },
      {
        title: "View Fit All",
        doAction: function (context) {
          const scene = context.viewer.scene;
          context.viewer.cameraFlight.flyTo({
            projection: "perspective",
            aabb: scene.getAABB(),
            duration: 0.5,
          });
        },
      },
      {
        title: "Show in Tree",
        doAction: function (context) {
          const objectId = context.entity.id;
          context.treeViewPlugin.showNode(objectId);
        },
      },
    ],
    [
      {
        title: "Hide",
        getEnabled: function (context) {
          return context.entity.visible;
        },
        doAction: function (context) {
          context.entity.visible = false;
        },
      },
      {
        title: "Hide Others",
        doAction: function (context) {
          const viewer = context.viewer;
          const scene = viewer.scene;
          const entity = context.entity;
          const metaObject = viewer.metaScene.metaObjects[entity.id];
          if (!metaObject) {
            return;
          }
          scene.setObjectsVisible(scene.visibleObjectIds, false);
          scene.setObjectsXRayed(scene.xrayedObjectIds, false);
          scene.setObjectsSelected(scene.selectedObjectIds, false);
          scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
          metaObject.withMetaObjectsInSubtree((metaObject) => {
            const entity = scene.objects[metaObject.id];
            if (entity) {
              entity.visible = true;
            }
          });
        },
      },
      {
        title: "Hide All",
        getEnabled: function (context) {
          return context.viewer.scene.numVisibleObjects > 0;
        },
        doAction: function (context) {
          context.viewer.scene.setObjectsVisible(
            context.viewer.scene.visibleObjectIds,
            false
          );
        },
      },
      {
        title: "Show All",
        getEnabled: function (context) {
          const scene = context.viewer.scene;
          return scene.numVisibleObjects < scene.numObjects;
        },
        doAction: function (context) {
          const scene = context.viewer.scene;
          scene.setObjectsVisible(scene.objectIds, true);
        },
      },
    ],
    [
      {
        title: "X-Ray",
        getEnabled: function (context) {
          return !context.entity.xrayed;
        },
        doAction: function (context) {
          context.entity.xrayed = true;
        },
      },
      {
        title: "Undo X-Ray",
        getEnabled: function (context) {
          return context.entity.xrayed;
        },
        doAction: function (context) {
          context.entity.xrayed = false;
        },
      },
      {
        title: "X-Ray Others",
        doAction: function (context) {
          const viewer = context.viewer;
          const scene = viewer.scene;
          const entity = context.entity;
          const metaObject = viewer.metaScene.metaObjects[entity.id];
          if (!metaObject) {
            return;
          }
          scene.setObjectsVisible(scene.objectIds, true);
          scene.setObjectsXRayed(scene.objectIds, true);
          scene.setObjectsSelected(scene.selectedObjectIds, false);
          scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
          metaObject.withMetaObjectsInSubtree((metaObject) => {
            const entity = scene.objects[metaObject.id];
            if (entity) {
              entity.xrayed = false;
            }
          });
        },
      },
      {
        title: "Reset X-Ray",
        getEnabled: function (context) {
          return context.viewer.scene.numXRayedObjects > 0;
        },
        doAction: function (context) {
          context.viewer.scene.setObjectsXRayed(
            context.viewer.scene.xrayedObjectIds,
            false
          );
        },
      },
    ],
    [
      {
        title: "Select",
        getEnabled: function (context) {
          return !context.entity.selected;
        },
        doAction: function (context) {
          context.entity.selected = true;
        },
      },
      {
        title: "Undo select",
        getEnabled: function (context) {
          return context.entity.selected;
        },
        doAction: function (context) {
          context.entity.selected = false;
        },
      },
      {
        title: "Clear Selection",
        getEnabled: function (context) {
          return context.viewer.scene.numSelectedObjects > 0;
        },
        doAction: function (context) {
          context.viewer.scene.setObjectsSelected(
            context.viewer.scene.selectedObjectIds,
            false
          );
        },
      },
    ],
  ],
  enabled: true,
});

viewer.cameraControl.on("rightClick", function (e) {
  var hit = viewer.scene.pick({
    canvasPos: e.canvasPos,
  });

  if (hit && hit.entity.isObject) {
    objectContextMenu.context = {
      // Must set context before showing menu
      viewer: viewer,
      treeViewPlugin: treeView,
      entity: hit.entity,
    };

    objectContextMenu.show(e.pagePos[0], e.pagePos[1]);
  } else {
    canvasContextMenu.context = {
      // Must set context before showing menu
      viewer: viewer,
    };

    canvasContextMenu.show(e.pagePos[0], e.pagePos[1]);
  }

  e.event.preventDefault();
});

//----------------------------------------------------------------------------------------------------------------------
// Load a model
//----------------------------------------------------------------------------------------------------------------------

// const xktLoader = new XKTLoaderPlugin(viewer);
// const model = xktLoader.load({
//     id: "myModel",
//     src: "Duplex.ifc.xkt",
//     edges: true,
//     excludeUnclassifiedObjects: false
// });

const webIFCLoader = new WebIFCLoaderPlugin(viewer, {
  wasmPath: "https://cdn.jsdelivr.net/npm/@xeokit/xeokit-sdk/dist/",
});

let archivoIFC = document.getElementById("fileInput");
archivoIFC.addEventListener(
  "change",
  (changed) => {
    const ifcURL = URL.createObjectURL(changed.target.files[0]);
    console.log(ifcURL);
    $("#ifcs").append("<p>" + archivoIFC.files[0].name + "<p>");
  },
  false
);

const model = webIFCLoader.load({
  src: "TESTED_Simple_project_01.ifc",
  edges: true,
  sao: true, // Enable ambient shadows for this model
  pbr: true, // Enable physically-based rendering for this model
});

const t0 = performance.now();
document.getElementById("time").innerHTML = "Loading model...";
model.on("loaded", function () {
  const t1 = performance.now();
  document.getElementById("time").innerHTML =
    "Model loaded in " +
    Math.floor(t1 - t0) / 1000.0 +
    " seconds<br>Objects: " +
    model.numEntities;
});

//------------------------------------------------------------------------------------------------------------------
// Mouse over entities to highlight them
//------------------------------------------------------------------------------------------------------------------

var lastEntity = null;

viewer.cameraControl.on("hover", function (pickResult) {
  if (pickResult) {
    if (!lastEntity || pickResult.entity.id !== lastEntity.id) {
      if (lastEntity) {
        lastEntity.highlighted = false;
      }

      lastEntity = pickResult.entity;
      pickResult.entity.highlighted = true;
    }
  } else {
    if (lastEntity) {
      lastEntity.highlighted = false;
      lastEntity = null;
    }
  }
});

window.viewer = viewer;

//------------------------------------------------------------------------------------------------------------------
// Mediciones
//------------------------------------------------------------------------------------------------------------------
// const distanceMeasurements = new DistanceMeasurementsPlugin(viewer);

// distanceMeasurements.control.activate();


//------------------------------------------------------------------------------------------------------------------
// Planos
//------------------------------------------------------------------------------------------------------------------

const sectionPlanes = new SectionPlanesPlugin(viewer, {
  overviewCanvasId: "mySectionPlanesOverviewCanvas",
  overviewVisible: true
});

sectionPlanes.createSectionPlane({
  id: "mySectionPlane",
  pos: [1.30, 2.46, 4.93],
  dir: [0.0, -0.09, -0.79]
});

sectionPlanes.createSectionPlane({
  id: "mySectionPlane2",
  pos: [1.30, 2.46, 4.93],
  dir: [0.0, -0.09, -0.79]
});

sectionPlanes.showControl("mySectionPlane2");