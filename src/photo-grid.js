const UI = require('sketch/ui'),
      DOM = require('sketch/dom'),
      Settings = require('sketch/settings');

const aspectRatios = [1, 10/8, 4/3, 7/5, 3/2, 16/9, 2/3, 5/7, 3/4, 8/10];

var options = initOptions();
var form = {};

function initOptions() {
  const defaults = {
    isRowLayout: true,
    padding: 16,
    hasWidthLimit: false,
    maxWidth: 1200
  };
  for (let option in defaults) {
    let value = eval(Settings.settingForKey(option));
    if (value === undefined) {
      Settings.setSettingForKey(option, defaults[option]);
    } else {
      defaults[option] = value;
    }
  }
  return defaults
}

export function onRandomizeAspectRatios(context) {
  var document = DOM.getSelectedDocument(),
      selection = document.selectedLayers;

  if (selection.length === 0) {
    UI.message('Select one or more layers');
  } else {
    let bounds = getBoundingBox(selection.layers);
    let groups = findGroups(selection.layers);

    groups.forEach(group => {
      randomizeAspectRatios(group, bounds);
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

    if (options.isRowLayout) {
      if (options.hasWidthLimit) {
        bounds.width = options.maxWidth;
      }

      let y = bounds.y;
      groups.forEach(group => {
        fitLayersInRows(group, bounds, y);
        y = group[0].sketchObject.absoluteRect().y() + group[0].frame.height + options.padding;
      });

    } else {

      let x = bounds.x;
      groups.forEach(group => {
        fitLayersInColumns(group, bounds, x);
        x = group[0].sketchObject.absoluteRect().x() + group[0].frame.width + options.padding;
      });

    }
  }
}

export function onSettings(context) {

  var alert = createDialog();

  var response = alert.runModal();

  if (response == "1000") {
    // This code only runs when the user clicks 'OK';

    // Get Spacing
    let spacingTextFieldInput = form.spacingTextField.stringValue();
    let spacingValue = parseInt(spacingTextFieldInput);

    if (isNaN(spacingValue) || spacingTextFieldInput === '') {
      UI.message('⚠️ The spacing was not changed. Try entering a number.');
    } else if (spacingValue < 0 || spacingValue > 1000) {
      UI.message('⚠️ Enter a spacing value between 0 and 1000');
    } else {
      options.padding = spacingValue;
      Settings.setSettingForKey('padding', spacingValue);
    }

    // Get Layout
    let layoutRadioInput = form.layoutMatrix.cells().indexOfObject(form.layoutMatrix.selectedCell());
    options.isRowLayout = (layoutRadioInput === 0)
    Settings.setSettingForKey('isRowLayout', options.isRowLayout);

    // Get max width setting
    options.hasWidthLimit = (form.hasWidthLimitCheckbox.state() == NSOnState);
    Settings.setSettingForKey('hasWidthLimit', options.hasWidthLimit);

    // Get width value
    let maxWidthTextFieldInput = form.maxWidthTextField.stringValue();
    let maxWidthValue = parseInt(maxWidthTextFieldInput);

    if (isNaN(maxWidthValue) || maxWidthTextFieldInput === '') {
      UI.message('⚠️ The maximum width was not changed. Try entering a number.');
    } else if (maxWidthValue < 10 || maxWidthValue > 10000) {
      UI.message('⚠️ Enter a maximum width between 10 and 10,000');
    } else {
      options.maxWidth = maxWidthValue;
      Settings.setSettingForKey('maxWidth', maxWidthValue);
    }

  }

}

function randomizeAspectRatios(layers, bounds) {
  let orderedLayers;

  let x = bounds.x,
      y = bounds.y;

  if (options.isRowLayout) {
    orderedLayers = layers.sort((a, b) => a.sketchObject.absoluteRect().x() - b.sketchObject.absoluteRect().x());
    y = orderedLayers[0].sketchObject.absoluteRect().y();
  } else {
    orderedLayers = layers.sort((a, b) => a.sketchObject.absoluteRect().y() - b.sketchObject.absoluteRect().y());
    x = orderedLayers[0].sketchObject.absoluteRect().x();
  }

  orderedLayers.forEach(layer => {

    layer.sketchObject.setConstrainProportions(0);

    let ratio = randomAspectRatio();
    let delta = getDelta(layer, x, y);
    let frame = layer.frame;

    frame.x += delta.x;
    frame.y += delta.y;

    if (options.isRowLayout) {
      frame.width = Math.round(frame.height * ratio);
      x += frame.width + options.padding;
    } else {
      frame.height = Math.round(frame.width / ratio);
      y += frame.height + options.padding;
    }

    layer.frame = frame;

  });

}

function randomAspectRatio() {
  return aspectRatios[Math.floor(Math.random() * aspectRatios.length)]
}

function fitLayersInRows(layers, bounds, y) {
  let min = bounds.x;
  let max = bounds.x + bounds.width;

  let orderedLayers = layers.sort((a, b) => a.sketchObject.absoluteRect().x() - b.sketchObject.absoluteRect().x());
  let lastLayer = orderedLayers[orderedLayers.length - 1];

  let height = Math.round(median(layers.map(layer => layer.frame.height)));
  let widths = layers.map(layer => layer.frame.width * height / layer.frame.height);
  let totalWidth = widths.reduce((total, current) => total + current);

  let totalPadding = (layers.length - 1) * options.padding;
  let scale = (max - min) / (totalWidth + totalPadding);

  let x = min;

  orderedLayers.forEach(layer => {

    layer.sketchObject.setConstrainProportions(0);

    let delta = getDelta(layer, x, y);
    let frame = layer.frame;

    frame.x += delta.x;
    frame.y += delta.y;

    frame.width = Math.round(frame.width * height / frame.height * scale);
    frame.height = Math.round(height * scale);
    x += frame.width + options.padding;

    layer.frame = frame;

  });

  let frame = lastLayer.frame;
  frame.width = max - lastLayer.sketchObject.absoluteRect().x();
  lastLayer.frame = frame;

}

function fitLayersInColumns(layers, bounds, x) {
  let min = bounds.y;
  let max = bounds.y + bounds.height;

  let orderedLayers = layers.sort((a, b) => a.sketchObject.absoluteRect().y() - b.sketchObject.absoluteRect().y());
  let lastLayer = orderedLayers[orderedLayers.length - 1];

  let width = Math.round(median(layers.map(layer => layer.frame.width)));
  let heights = layers.map(layer => layer.frame.height * width / layer.frame.width);
  let totalHeight = heights.reduce((total, current) => total + current);

  let totalPadding = (layers.length - 1) * options.padding;
  let scale = (max - min) / (totalHeight + totalPadding);

  let y = min;

  orderedLayers.forEach(layer => {

    layer.sketchObject.setConstrainProportions(0);

    let delta = getDelta(layer, x, y);
    let frame = layer.frame;

    frame.x += delta.x;
    frame.y += delta.y;

    frame.height = Math.round(frame.height * width / frame.width * scale);
    frame.width = Math.round(width * scale);
    y += frame.height + options.padding;

    layer.frame = frame;

  });

  let frame = lastLayer.frame;
  frame.height = max - lastLayer.sketchObject.absoluteRect().y();
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

function createDialog() {

  var viewWidth = 360;
  var viewHeight = 250;

  // Setup the window
  var dialog = NSAlert.alloc().init();
  dialog.setMessageText('Photo Grid Settings')
  dialog.addButtonWithTitle('Ok');
  dialog.addButtonWithTitle('Cancel');

  // Create the main view
  var view = NSView.alloc().initWithFrame(NSMakeRect(0, 0, viewWidth, viewHeight));
  dialog.setAccessoryView(view);

  // --------------------------------------------------------------------------

  // Create labels
  var infoLabel = createTextField('Choose row or column layout and set the layer spacing. Photo Grid will try to keep layers in existing rows or columns.' , NSMakeRect(0, viewHeight - 40, viewWidth - 10, 40));
  var spacingLabel = createTextField('Spacing:', NSMakeRect(0, viewHeight - 70, 200, 20));
  var layoutLabel = createTextField('Layout:', NSMakeRect(0, viewHeight - 135, 200, 20));
  var maxWidthLabel = createTextField('Scale and Fit Rows to Fixed Width:', NSMakeRect(0, viewHeight - 200, viewWidth -10, 20));

  // Create textfields
  form.spacingTextField = NSTextField.alloc().initWithFrame(NSMakeRect(0, viewHeight - 95, 70, 20));
  form.maxWidthTextField = NSTextField.alloc().initWithFrame(NSMakeRect(90, viewHeight - 225, 70, 20));

  // Create checkbox
  form.hasWidthLimitCheckbox = createCheckbox('On', NSMakeRect(0, viewHeight - 225, 90, 20), options.hasWidthLimit);


  // --------------------------------------------------------------------------

  // Create radiobuttons prototype
  var buttonFormat = NSButtonCell.alloc().init();
  buttonFormat.setButtonType(NSRadioButton);

  // Create matrix for radio buttons
  form.layoutMatrix = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(
    NSMakeRect(0, viewHeight - 160, viewWidth, 20),
    NSRadioModeMatrix,
    buttonFormat,
    1,
    2
  );

  form.layoutMatrix.setCellSize(CGSizeMake(90, 20));

  var cells = form.layoutMatrix.cells();
  cells.objectAtIndex(0).setTitle('Rows →');
  cells.objectAtIndex(1).setTitle('Columns ↓');

  // --------------------------------------------------------------------------

  // Configure inputs
  form.spacingTextField.setStringValue(String(options.padding));
  form.maxWidthTextField.setStringValue(String(options.maxWidth));

  form.maxWidthTextField.setEnabled(options.hasWidthLimit);

  if (options.isRowLayout) {
    form.layoutMatrix.selectCellAtRow_column(0, 0);
  } else {
    form.layoutMatrix.selectCellAtRow_column(0, 1);
    form.hasWidthLimitCheckbox.setEnabled(false);
    form.maxWidthTextField.setEnabled(false);
  }

  // --------------------------------------------------------------------------

  // Enable / Disable
  form.hasWidthLimitCheckbox.setCOSJSTargetFunction((sender) => {
    form.maxWidthTextField.setEnabled(sender.state() == NSOnState);
  });

  form.layoutMatrix.setCOSJSTargetFunction((sender) => {
    let layoutRadioInput = form.layoutMatrix.cells().indexOfObject(form.layoutMatrix.selectedCell());
    let isRowLayout = (layoutRadioInput === 0);
    let hasWidthLimit = (form.hasWidthLimitCheckbox.state() == NSOnState);
    if (isRowLayout) {
      form.hasWidthLimitCheckbox.setEnabled(true);
      form.maxWidthTextField.setEnabled(hasWidthLimit);
    } else {
      form.hasWidthLimitCheckbox.setEnabled(false);
      form.maxWidthTextField.setEnabled(false);
    }
  });

  // --------------------------------------------------------------------------

  // Add inputs to view
  view.addSubview(infoLabel);
  view.addSubview(spacingLabel);
  view.addSubview(layoutLabel);
  view.addSubview(maxWidthLabel);
  view.addSubview(form.spacingTextField);
  view.addSubview(form.maxWidthTextField);
  view.addSubview(form.layoutMatrix);
  view.addSubview(form.hasWidthLimitCheckbox);

  // --------------------------------------------------------------------------

  // Show the dialog window
  return dialog;
}

function createTextField(stringValue, frame) {
  let textField = NSTextField.alloc().initWithFrame(frame);
  textField.setStringValue(stringValue);
  textField.setSelectable(false);
  textField.setEditable(false);
  textField.setBezeled(false);
  textField.setDrawsBackground(false);
  return textField;
}

function createCheckbox(title, frame, isChecked) {

  let checkbox = NSButton.alloc().initWithFrame(frame);
  checkbox.setButtonType(NSSwitchButton);
  checkbox.setBezelStyle(0);
  checkbox.setTitle(title);
  if (isChecked) {
    checkbox.setState(NSOnState);
  } else {
    checkbox.setState(NSOffState);
  }

  return checkbox;
}
