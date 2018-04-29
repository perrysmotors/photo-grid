const UI = require('sketch/ui'),
      DOM = require('sketch/dom'),
      Settings = require('sketch/settings');

export function onRandomizeAspectRatios(context) {
  var document = DOM.getSelectedDocument(),
      selection = document.selectedLayers;

  if (selection.length === 0) {
    UI.message('Select one or more layers');
  } else {

    const aspectRatios = [1, 10/8, 4/3, 7/5, 3/2, 16/9, 2/3, 5/7, 3/4, 8/10];
    let padding = getPadding();

    let orderedLayers = selection.map(layer => layer).sort((a, b) => a.frame.x - b.frame.x);
    let firstLayer = orderedLayers[0];
    let x = firstLayer.frame.x;

    orderedLayers.forEach(layer => {

      layer.sketchObject.setConstrainProportions(0);

      let ratio = aspectRatios[Math.floor(Math.random() * aspectRatios.length)]
      let frame = layer.frame;
      let height = frame.height;

      frame.x = x;
      frame.width = Math.round(height * ratio);

      layer.frame = frame;

      x += frame.width + padding;

    });
  }

}

export function onFit(context) {
  var document = DOM.getSelectedDocument(),
      selection = document.selectedLayers;

  if (selection.length === 0) {
    UI.message('Select one or more layers');
  } else {

    let orderedLayers = selection.map(layer => layer).sort((a, b) => a.frame.x - b.frame.x);
    let firstLayer = orderedLayers[0];
    let lastLayer = orderedLayers[orderedLayers.length - 1];

    let height = Math.round(median(selection.map(layer => layer.frame.height)));
    let widths = selection.map(layer => layer.frame.width * height / layer.frame.height);
    let totalWidth = widths.reduce((total, current) => total + current);

    let minX = firstLayer.frame.x;
    let maxX = lastLayer.frame.x + lastLayer.frame.width;

    let padding = getPadding();
    let totalPadding = (selection.length - 1) * padding;
    let scale = (maxX - minX) / (totalWidth + totalPadding);

    let x = minX;
    let y = firstLayer.frame.y;

    orderedLayers.forEach(layer => {

      layer.sketchObject.setConstrainProportions(0);

      let frame = layer.frame;
      frame.x = x;
      frame.y = y;
      frame.width = Math.round(frame.width * height / frame.height * scale);
      frame.height = Math.round(height * scale);
      layer.frame = frame;

      x += frame.width + padding;

    });

    let frame = lastLayer.frame;
    frame.width = maxX - frame.x;
    lastLayer.frame = frame;

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
