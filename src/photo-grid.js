const UI = require('sketch/ui'),
      DOM = require('sketch/dom'),
      Settings = require('sketch/settings');

export function onRandomizeAspectRatios(context) {
  var document = DOM.getSelectedDocument(),
      selection = document.selectedLayers;

  if (selection.length === 0) {
    UI.message('Select one or more layers');
  } else {
    let bounds = getBoundingBox(selection.layers);
    let rows = findRows(selection.layers);

    // let i = 1;

    rows.forEach(row => {
      randomizeAspectRatios(row, bounds.x);
      // numberLayers(row, `Row ${i++}`);
    });
  }
}

export function onFit(context) {
  var document = DOM.getSelectedDocument(),
      selection = document.selectedLayers;

  if (selection.length === 0) {
    UI.message('Select one or more layers');
  } else {
    let bounds = getBoundingBox(selection.layers);
    let rows = findRows(selection.layers);

    // let i = 1;
    let y = bounds.y;

    rows.forEach(row => {
      fitLayers(row, bounds.x, bounds.x + bounds.width, y);
      y = row[0].sketchObject.absoluteRect().y() + row[0].frame.height + getPadding();
    });
  }
}

export function onSettings(context) {
  let padding = getPadding();
  let input = UI.getStringFromUser("Enter a padding value", padding);
  if (input != 'null') {
    let value = parseInt(input);
    if (isNaN(value) || input === '') {
      UI.message('⚠️ The padding was not changed. Try entering a number.');
    } else if (value < 0 || value > 1000) {
      UI.message('⚠️ Enter a number between 0 and 1000');
    } else {
      Settings.setSettingForKey('padding', value);
    }
  }
}

function randomizeAspectRatios(layers, x, y) {

  const aspectRatios = [1, 10/8, 4/3, 7/5, 3/2, 16/9, 2/3, 5/7, 3/4, 8/10];
  let padding = getPadding();

  let orderedLayers = layers.sort((a, b) => a.sketchObject.absoluteRect().x() - b.sketchObject.absoluteRect().x());
  let firstLayer = orderedLayers[0];

  x = x || firstLayer.sketchObject.absoluteRect().x();
  y = y || firstLayer.sketchObject.absoluteRect().y();

  orderedLayers.forEach(layer => {

    layer.sketchObject.setConstrainProportions(0);

    let absoluteRect = layer.sketchObject.absoluteRect();
    let ratio = aspectRatios[Math.floor(Math.random() * aspectRatios.length)]
    let frame = layer.frame;
    let height = frame.height;

    let delta = getDelta(layer, x, y);

    frame.x += delta.x;
    frame.y += delta.y;
    frame.width = Math.round(height * ratio);

    layer.frame = frame;

    x += frame.width + padding;

  });

}

function fitLayers(layers, minX, maxX, y) {

  let orderedLayers = layers.sort((a, b) => a.sketchObject.absoluteRect().x() - b.sketchObject.absoluteRect().x());
  let firstLayer = orderedLayers[0];
  let lastLayer = orderedLayers[orderedLayers.length - 1];

  let height = Math.round(median(layers.map(layer => layer.frame.height)));
  let widths = layers.map(layer => layer.frame.width * height / layer.frame.height);
  let totalWidth = widths.reduce((total, current) => total + current);

  minX = minX || firstLayer.sketchObject.absoluteRect().x();
  maxX = maxX || lastLayer.sketchObject.absoluteRect().x() + lastLayer.frame.width;

  let padding = getPadding();
  let totalPadding = (layers.length - 1) * padding;
  let scale = (maxX - minX) / (totalWidth + totalPadding);

  let x = minX;
  y = y || firstLayer.sketchObject.absoluteRect().y();

  orderedLayers.forEach(layer => {

    layer.sketchObject.setConstrainProportions(0);

    let frame = layer.frame;

    let delta = getDelta(layer, x, y);

    frame.x += delta.x;
    frame.y += delta.y;
    frame.width = Math.round(frame.width * height / frame.height * scale);
    frame.height = Math.round(height * scale);
    layer.frame = frame;

    x += frame.width + padding;

  });

  let frame = lastLayer.frame;
  frame.width = maxX - lastLayer.sketchObject.absoluteRect().x();
  lastLayer.frame = frame;

}

function getDelta(layer, x, y) {
  let absoluteRect = layer.sketchObject.absoluteRect();
  let deltaX = x - absoluteRect.x();
  let deltaY = y - absoluteRect.y();
  return {x: deltaX, y: deltaY};
}


function findRows(layers) {
  let rows = [];
  let remainingLayers = new Set(layers);
  let medianRowHeight = Math.round(median(layers.map(layer => layer.frame.height)));

  while (remainingLayers.size > 0) {
    let largestRow = [];
    remainingLayers.forEach(layer => {
      let row = findLayersInRow(remainingLayers, layer, medianRowHeight);
      if (row.length > largestRow.length) {
        largestRow = row;
      }
    });

    largestRow.forEach(layer => {
      remainingLayers.delete(layer);
    });

    rows.push(largestRow);
  }

  return rows.sort((rowA, rowB) => rowA[0].sketchObject.absoluteRect().y() - rowB[0].sketchObject.absoluteRect().y());
}

function findLayersInRow(layers, referenceLayer, rowHeight) {

  let rowCentre = getLayerCentre(referenceLayer);
  let top = rowCentre - rowHeight / 2;
  let bottom = rowCentre + rowHeight / 2;
  let layersInRow = [];

  layers.forEach(layer => {
    let centre = getLayerCentre(layer);
    if (centre > top && centre < bottom) {
      layersInRow.push(layer);
    }
  });

  return layersInRow;
}

function getPadding() {
  let padding = Settings.settingForKey('padding');
  if (padding === undefined) {
    padding = 16;
    Settings.setSettingForKey('padding', 16);
  }
  return padding;
}

function median(values) {
  values.sort((a, b) => a - b);
  let half = Math.floor(values.length/2);

  if (values.length % 2) {
    return values[half];
  } else {
    return (values[half-1] + values[half]) / 2.0;
  }
}

function getBoundingBox(layers) {
  let lefts = layers.map(layer => layer.sketchObject.absoluteRect().x()).sort((a, b) => a - b);
  let rights = layers.map(layer => layer.sketchObject.absoluteRect().x() + layer.frame.width).sort((a, b) => a - b);
  let tops = layers.map(layer => layer.sketchObject.absoluteRect().y()).sort((a, b) => a - b);
  let bottoms = layers.map(layer => layer.sketchObject.absoluteRect().y() + layer.frame.height).sort((a, b) => a - b);
  return {
    x: lefts[0],
    y: tops[0],
    width: rights[layers.length - 1] - lefts[0],
    height: bottoms[layers.length - 1] - tops[0]
  }
}

function getLayerCentre(layer) {
  return layer.sketchObject.absoluteRect().y() + layer.frame.height / 2;
}

// function compareFlowOrder(layerA, layerB) {
//   let valueA = layerA.sketchObject.absoluteRect().x() + layerA.sketchObject.absoluteRect().y() * 1000;
//   let valueB = layerB.sketchObject.absoluteRect().x() + layerB.sketchObject.absoluteRect().y() * 1000;
//   return valueA - valueB;
// }

// function numberLayers(layers, prefix) {
//   let i = 1;
//   layers.forEach(layer => {
//     layer.name += `${prefix}-${i++}`
//   });
// }
