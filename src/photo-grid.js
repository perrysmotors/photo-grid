const UI = require('sketch/ui'),
      DOM = require('sketch/dom'),
      Settings = require('sketch/settings');

const aspectRatios = [1, 10/8, 4/3, 7/5, 3/2, 16/9, 2/3, 5/7, 3/4, 8/10];

var options = {
  isRowLayout: true,
  padding: getPadding()
};

export function onRandomizeAspectRatios(context) {
  var document = DOM.getSelectedDocument(),
      selection = document.selectedLayers;

  if (selection.length === 0) {
    UI.message('Select one or more layers');
  } else {
    let bounds = getBoundingBox(selection.layers);
    let groups = findGroups(selection.layers);

    // let i = 1;

    groups.forEach(group => {
      randomizeAspectRatios(group, bounds.x);
      // numberLayers(group, `Group ${i++}`);
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
    let groups = findGroups(selection.layers);

    // let i = 1;
    let y = bounds.y;

    groups.forEach(group => {
      fitLayers(group, bounds.x, bounds.x + bounds.width, y);
      y = group[0].sketchObject.absoluteRect().y() + group[0].frame.height + getPadding();
    });
  }
}

export function onSettings(context) {
  let input = UI.getStringFromUser("Enter a padding value", options.padding);
  if (input != 'null') {
    let value = parseInt(input);
    if (isNaN(value) || input === '') {
      UI.message('⚠️ The padding was not changed. Try entering a number.');
    } else if (value < 0 || value > 1000) {
      UI.message('⚠️ Enter a number between 0 and 1000');
    } else {
      Settings.setSettingForKey('padding', value);
      options.padding = value;
    }
  }
}

function randomizeAspectRatios(layers, x, y) {

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

    x += frame.width + options.padding;

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

  let totalPadding = (layers.length - 1) * options.padding;
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

    x += frame.width + options.padding;

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


function findGroups(layers) {
  let groups = [];
  let remainingLayers = new Set(layers);

  let range;
  if (options.isRowLayout) {
    range = Math.round(median(layers.map(layer => layer.frame.height)));
  } else {
    range = Math.round(median(layers.map(layer => layer.frame.width)));
  }

  while (remainingLayers.size > 0) {
    let largestGroup = [];
    remainingLayers.forEach(layer => {
      let group = findLayersInGroup(remainingLayers, layer, range);
      if (group.length > largestGroup.length) {
        largestGroup = group;
      }
    });

    largestGroup.forEach(layer => {
      remainingLayers.delete(layer);
    });

    groups.push(largestGroup);
  }

  if (options.isRowLayout) {
    return groups.sort((groupA, groupB) => groupA[0].sketchObject.absoluteRect().y() - groupB[0].sketchObject.absoluteRect().y());
  } else {
    return groups.sort((groupA, groupB) => groupA[0].sketchObject.absoluteRect().x() - groupB[0].sketchObject.absoluteRect().x());
  }

}

function findLayersInGroup(layers, referenceLayer, range) {

  let found = [];
  let rowCentre = getLayerCentre(referenceLayer);

  if (options.isRowLayout) {

    let lower = rowCentre.y - range / 2;
    let upper = rowCentre.y + range / 2;

    layers.forEach(layer => {
      let centre = getLayerCentre(layer);
      if (centre.y > lower && centre.y < upper) {
        found.push(layer);
      }
    });

  } else {

    let lower = rowCentre.x - range / 2;
    let upper = rowCentre.x + range / 2;

    layers.forEach(layer => {
      let centre = getLayerCentre(layer);
      if (centre.x > lower && centre.x < upper) {
        found.push(layer);
      }
    });

  }

  return found;
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
  return {
    x: layer.sketchObject.absoluteRect().x() + layer.frame.width / 2,
    y: layer.sketchObject.absoluteRect().y() + layer.frame.height / 2
  };
}

// function numberLayers(layers, prefix) {
//   let i = 1;
//   layers.forEach(layer => {
//     layer.name += `${prefix}-${i++}`
//   });
// }
