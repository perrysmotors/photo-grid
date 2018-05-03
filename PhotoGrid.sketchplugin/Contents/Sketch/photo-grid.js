var that = this;
function __skpm_run (key, context) {
  that.context = context;

var exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/photo-grid.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/photo-grid.js":
/*!***************************!*\
  !*** ./src/photo-grid.js ***!
  \***************************/
/*! exports provided: onRandomizeAspectRatios, onFit, onSettings */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "onRandomizeAspectRatios", function() { return onRandomizeAspectRatios; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "onFit", function() { return onFit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "onSettings", function() { return onSettings; });
var UI = __webpack_require__(/*! sketch/ui */ "sketch/ui"),
    DOM = __webpack_require__(/*! sketch/dom */ "sketch/dom"),
    Settings = __webpack_require__(/*! sketch/settings */ "sketch/settings");

var aspectRatios = [1, 10 / 8, 4 / 3, 7 / 5, 3 / 2, 16 / 9, 2 / 3, 5 / 7, 3 / 4, 8 / 10];
var options = initOptions();
var form = {};

function initOptions() {
  var defaults = {
    isRowLayout: true,
    padding: 16
  };

  for (var option in defaults) {
    var value = eval(Settings.settingForKey(option));

    if (value === undefined) {
      Settings.setSettingForKey(option, defaults[option]);
    } else {
      defaults[option] = value;
    }
  }

  return defaults;
}

function onRandomizeAspectRatios(context) {
  var document = DOM.getSelectedDocument(),
      selection = document.selectedLayers;

  if (selection.length === 0) {
    UI.message('Select one or more layers');
  } else {
    var bounds = getBoundingBox(selection.layers);
    var groups = findGroups(selection.layers);
    groups.forEach(function (group) {
      randomizeAspectRatios(group, bounds);
    });
  }
}
function onFit(context) {
  var document = DOM.getSelectedDocument(),
      selection = document.selectedLayers;

  if (selection.length === 0) {
    UI.message('Select one or more layers');
  } else {
    var bounds = getBoundingBox(selection.layers);
    var groups = findGroups(selection.layers);

    if (options.isRowLayout) {
      var y = bounds.y;
      groups.forEach(function (group) {
        fitLayersInRows(group, bounds, y);
        y = group[0].sketchObject.absoluteRect().y() + group[0].frame.height + options.padding;
      });
    } else {
      var x = bounds.x;
      groups.forEach(function (group) {
        fitLayersInColumns(group, bounds, x);
        x = group[0].sketchObject.absoluteRect().x() + group[0].frame.width + options.padding;
      });
    }
  }
}
function onSettings(context) {
  var window = createWindow(context);
  var alert = window[0];
  var response = alert.runModal();

  if (response == "1000") {
    // This code only runs when the user clicks 'OK';
    // Get Layout
    var layoutRadioInput = form.matrixFormat.cells().indexOfObject(form.matrixFormat.selectedCell());
    options.isRowLayout = layoutRadioInput === 0;
    Settings.setSettingForKey('isRowLayout', options.isRowLayout); // Get Spacing

    var spacingTextFieldInput = form.spacingTextField.stringValue();
    var spacingValue = parseInt(spacingTextFieldInput);

    if (isNaN(spacingValue) || spacingTextFieldInput === '') {
      UI.message('⚠️ The spacing was not changed. Try entering a number.');
    } else if (spacingValue < 0 || spacingValue > 1000) {
      UI.message('⚠️ Enter a number between 0 and 1000');
    } else {
      options.padding = spacingValue;
      Settings.setSettingForKey('padding', spacingValue);
    }
  }
}

function randomizeAspectRatios(layers, bounds) {
  var orderedLayers;
  var x = bounds.x,
      y = bounds.y;

  if (options.isRowLayout) {
    orderedLayers = layers.sort(function (a, b) {
      return a.sketchObject.absoluteRect().x() - b.sketchObject.absoluteRect().x();
    });
    y = orderedLayers[0].sketchObject.absoluteRect().y();
  } else {
    orderedLayers = layers.sort(function (a, b) {
      return a.sketchObject.absoluteRect().y() - b.sketchObject.absoluteRect().y();
    });
    x = orderedLayers[0].sketchObject.absoluteRect().x();
  }

  orderedLayers.forEach(function (layer) {
    layer.sketchObject.setConstrainProportions(0);
    var ratio = randomAspectRatio();
    var delta = getDelta(layer, x, y);
    var frame = layer.frame;
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
  return aspectRatios[Math.floor(Math.random() * aspectRatios.length)];
}

function fitLayersInRows(layers, bounds, y) {
  var min = bounds.x;
  var max = bounds.x + bounds.width;
  var orderedLayers = layers.sort(function (a, b) {
    return a.sketchObject.absoluteRect().x() - b.sketchObject.absoluteRect().x();
  });
  var lastLayer = orderedLayers[orderedLayers.length - 1];
  var height = Math.round(median(layers.map(function (layer) {
    return layer.frame.height;
  })));
  var widths = layers.map(function (layer) {
    return layer.frame.width * height / layer.frame.height;
  });
  var totalWidth = widths.reduce(function (total, current) {
    return total + current;
  });
  var totalPadding = (layers.length - 1) * options.padding;
  var scale = (max - min) / (totalWidth + totalPadding);
  var x = min;
  orderedLayers.forEach(function (layer) {
    layer.sketchObject.setConstrainProportions(0);
    var delta = getDelta(layer, x, y);
    var frame = layer.frame;
    frame.x += delta.x;
    frame.y += delta.y;
    frame.width = Math.round(frame.width * height / frame.height * scale);
    frame.height = Math.round(height * scale);
    x += frame.width + options.padding;
    layer.frame = frame;
  });
  var frame = lastLayer.frame;
  frame.width = max - lastLayer.sketchObject.absoluteRect().x();
  lastLayer.frame = frame;
}

function fitLayersInColumns(layers, bounds, x) {
  var min = bounds.y;
  var max = bounds.y + bounds.height;
  var orderedLayers = layers.sort(function (a, b) {
    return a.sketchObject.absoluteRect().y() - b.sketchObject.absoluteRect().y();
  });
  var lastLayer = orderedLayers[orderedLayers.length - 1];
  var width = Math.round(median(layers.map(function (layer) {
    return layer.frame.width;
  })));
  var heights = layers.map(function (layer) {
    return layer.frame.height * width / layer.frame.width;
  });
  var totalHeight = heights.reduce(function (total, current) {
    return total + current;
  });
  var totalPadding = (layers.length - 1) * options.padding;
  var scale = (max - min) / (totalHeight + totalPadding);
  var y = min;
  orderedLayers.forEach(function (layer) {
    layer.sketchObject.setConstrainProportions(0);
    var delta = getDelta(layer, x, y);
    var frame = layer.frame;
    frame.x += delta.x;
    frame.y += delta.y;
    frame.height = Math.round(frame.height * width / frame.width * scale);
    frame.width = Math.round(width * scale);
    y += frame.height + options.padding;
    layer.frame = frame;
  });
  var frame = lastLayer.frame;
  frame.height = max - lastLayer.sketchObject.absoluteRect().y();
  lastLayer.frame = frame;
}

function getDelta(layer, x, y) {
  var absoluteRect = layer.sketchObject.absoluteRect();
  var deltaX = x - absoluteRect.x();
  var deltaY = y - absoluteRect.y();
  return {
    x: deltaX,
    y: deltaY
  };
}

function findGroups(layers) {
  var groups = [];
  var remainingLayers = new Set(layers);
  var range;

  if (options.isRowLayout) {
    range = Math.round(median(layers.map(function (layer) {
      return layer.frame.height;
    })));
  } else {
    range = Math.round(median(layers.map(function (layer) {
      return layer.frame.width;
    })));
  }

  var _loop = function _loop() {
    var largestGroup = [];
    remainingLayers.forEach(function (layer) {
      var group = findLayersInGroup(remainingLayers, layer, range);

      if (group.length > largestGroup.length) {
        largestGroup = group;
      }
    });
    largestGroup.forEach(function (layer) {
      remainingLayers.delete(layer);
    });
    groups.push(largestGroup);
  };

  while (remainingLayers.size > 0) {
    _loop();
  }

  if (options.isRowLayout) {
    return groups.sort(function (groupA, groupB) {
      return groupA[0].sketchObject.absoluteRect().y() - groupB[0].sketchObject.absoluteRect().y();
    });
  } else {
    return groups.sort(function (groupA, groupB) {
      return groupA[0].sketchObject.absoluteRect().x() - groupB[0].sketchObject.absoluteRect().x();
    });
  }
}

function findLayersInGroup(layers, referenceLayer, range) {
  var found = [];
  var rowCentre = getLayerCentre(referenceLayer);

  if (options.isRowLayout) {
    var lower = rowCentre.y - range / 2;
    var upper = rowCentre.y + range / 2;
    layers.forEach(function (layer) {
      var centre = getLayerCentre(layer);

      if (centre.y > lower && centre.y < upper) {
        found.push(layer);
      }
    });
  } else {
    var _lower = rowCentre.x - range / 2;

    var _upper = rowCentre.x + range / 2;

    layers.forEach(function (layer) {
      var centre = getLayerCentre(layer);

      if (centre.x > _lower && centre.x < _upper) {
        found.push(layer);
      }
    });
  }

  return found;
}

function median(values) {
  values.sort(function (a, b) {
    return a - b;
  });
  var half = Math.floor(values.length / 2);

  if (values.length % 2) {
    return values[half];
  } else {
    return (values[half - 1] + values[half]) / 2.0;
  }
}

function getBoundingBox(layers) {
  var lefts = layers.map(function (layer) {
    return layer.sketchObject.absoluteRect().x();
  }).sort(function (a, b) {
    return a - b;
  });
  var rights = layers.map(function (layer) {
    return layer.sketchObject.absoluteRect().x() + layer.frame.width;
  }).sort(function (a, b) {
    return a - b;
  });
  var tops = layers.map(function (layer) {
    return layer.sketchObject.absoluteRect().y();
  }).sort(function (a, b) {
    return a - b;
  });
  var bottoms = layers.map(function (layer) {
    return layer.sketchObject.absoluteRect().y() + layer.frame.height;
  }).sort(function (a, b) {
    return a - b;
  });
  return {
    x: lefts[0],
    y: tops[0],
    width: rights[layers.length - 1] - lefts[0],
    height: bottoms[layers.length - 1] - tops[0]
  };
}

function getLayerCentre(layer) {
  return {
    x: layer.sketchObject.absoluteRect().x() + layer.frame.width / 2,
    y: layer.sketchObject.absoluteRect().y() + layer.frame.height / 2
  };
} // function numberLayers(layers, prefix) {
//   let i = 1;
//   layers.forEach(layer => {
//     layer.name += `${prefix}-${i++}`
//   });
// }


function createWindow(context) {
  // Setup the window
  var alert = COSAlertWindow.new();
  alert.setMessageText("Photo Grid Settings");
  alert.addButtonWithTitle("Ok");
  alert.addButtonWithTitle("Cancel"); // Create the main view

  var viewWidth = 400;
  var viewHeight = 200;
  var viewSpacer = 10;
  var view = NSView.alloc().initWithFrame(NSMakeRect(0, 0, viewWidth, viewHeight));
  alert.addAccessoryView(view); // --------------------------------------------------------------------------
  // Create labels

  var infoLabel = NSTextField.alloc().initWithFrame(NSMakeRect(0, viewHeight - 50, viewWidth - 100, 50));
  var spacingLabel = NSTextField.alloc().initWithFrame(NSMakeRect(0, viewHeight - 90, viewWidth / 2 - 10, 20));
  var layoutLabel = NSTextField.alloc().initWithFrame(NSMakeRect(0, viewHeight - 155, viewWidth - 100, 20)); // Configure labels

  infoLabel.setStringValue("Choose row or column layout and set the layer spacing. Photo Grid will try to keep layers in existing rows or columns.");
  infoLabel.setSelectable(false);
  infoLabel.setEditable(false);
  infoLabel.setBezeled(false);
  infoLabel.setDrawsBackground(false);
  spacingLabel.setStringValue("Spacing:");
  spacingLabel.setSelectable(false);
  spacingLabel.setEditable(false);
  spacingLabel.setBezeled(false);
  spacingLabel.setDrawsBackground(false);
  layoutLabel.setStringValue("Layout:");
  layoutLabel.setSelectable(false);
  layoutLabel.setEditable(false);
  layoutLabel.setBezeled(false);
  layoutLabel.setDrawsBackground(false); // Add labels

  view.addSubview(infoLabel);
  view.addSubview(spacingLabel);
  view.addSubview(layoutLabel); // --------------------------------------------------------------------------
  // Create textfields

  form.spacingTextField = NSTextField.alloc().initWithFrame(NSMakeRect(0, viewHeight - 115, 60, 20)); // Configure textfields

  form.spacingTextField.setStringValue(options.padding); // Add textfields

  view.addSubview(form.spacingTextField); // --------------------------------------------------------------------------
  // Create radiobuttons prototype

  var buttonFormat = NSButtonCell.alloc().init();
  buttonFormat.setButtonType(NSRadioButton); // Create matrix for radio buttons

  form.matrixFormat = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(NSMakeRect(0, viewHeight - 210, 400, 50), NSRadioModeMatrix, buttonFormat, 1, 2);
  form.matrixFormat.setCellSize(CGSizeMake(90, 25));
  var cells = form.matrixFormat.cells();
  cells.objectAtIndex(0).setTitle("Rows →");
  cells.objectAtIndex(1).setTitle("Columns ↓"); // Configure radiobuttons

  if (options.isRowLayout) {
    form.matrixFormat.selectCellAtRow_column(0, 0);
  } else {
    form.matrixFormat.selectCellAtRow_column(0, 1);
  } // Add matrix


  view.addSubview(form.matrixFormat); // --------------------------------------------------------------------------
  // Show the dialog window

  return [alert];
}

/***/ }),

/***/ "sketch/dom":
/*!*****************************!*\
  !*** external "sketch/dom" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("sketch/dom");

/***/ }),

/***/ "sketch/settings":
/*!**********************************!*\
  !*** external "sketch/settings" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("sketch/settings");

/***/ }),

/***/ "sketch/ui":
/*!****************************!*\
  !*** external "sketch/ui" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("sketch/ui");

/***/ })

/******/ });
  if (key === 'default' && typeof exports === 'function') {
    exports(context);
  } else {
    exports[key](context);
  }
}
that['onRandomizeAspectRatios'] = __skpm_run.bind(this, 'onRandomizeAspectRatios');
that['onRun'] = __skpm_run.bind(this, 'default');
that['onFit'] = __skpm_run.bind(this, 'onFit');
that['onSettings'] = __skpm_run.bind(this, 'onSettings')

//# sourceMappingURL=photo-grid.js.map