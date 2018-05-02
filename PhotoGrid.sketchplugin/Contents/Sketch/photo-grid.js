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

var settings = {
  isRowLayout: true
};
function onRandomizeAspectRatios(context) {
  var document = DOM.getSelectedDocument(),
      selection = document.selectedLayers;

  if (selection.length === 0) {
    UI.message('Select one or more layers');
  } else {
    var bounds = getBoundingBox(selection.layers);
    var groups = findGroups(selection.layers); // let i = 1;

    groups.forEach(function (group) {
      randomizeAspectRatios(group, bounds.x); // numberLayers(group, `Group ${i++}`);
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
    var groups = findGroups(selection.layers); // let i = 1;

    var y = bounds.y;
    groups.forEach(function (group) {
      fitLayers(group, bounds.x, bounds.x + bounds.width, y);
      y = group[0].sketchObject.absoluteRect().y() + group[0].frame.height + getPadding();
    });
  }
}
function onSettings(context) {
  var padding = getPadding();
  var input = UI.getStringFromUser("Enter a padding value", padding);

  if (input != 'null') {
    var value = parseInt(input);

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
  var aspectRatios = [1, 10 / 8, 4 / 3, 7 / 5, 3 / 2, 16 / 9, 2 / 3, 5 / 7, 3 / 4, 8 / 10];
  var padding = getPadding();
  var orderedLayers = layers.sort(function (a, b) {
    return a.sketchObject.absoluteRect().x() - b.sketchObject.absoluteRect().x();
  });
  var firstLayer = orderedLayers[0];
  x = x || firstLayer.sketchObject.absoluteRect().x();
  y = y || firstLayer.sketchObject.absoluteRect().y();
  orderedLayers.forEach(function (layer) {
    layer.sketchObject.setConstrainProportions(0);
    var absoluteRect = layer.sketchObject.absoluteRect();
    var ratio = aspectRatios[Math.floor(Math.random() * aspectRatios.length)];
    var frame = layer.frame;
    var height = frame.height;
    var delta = getDelta(layer, x, y);
    frame.x += delta.x;
    frame.y += delta.y;
    frame.width = Math.round(height * ratio);
    layer.frame = frame;
    x += frame.width + padding;
  });
}

function fitLayers(layers, minX, maxX, y) {
  var orderedLayers = layers.sort(function (a, b) {
    return a.sketchObject.absoluteRect().x() - b.sketchObject.absoluteRect().x();
  });
  var firstLayer = orderedLayers[0];
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
  minX = minX || firstLayer.sketchObject.absoluteRect().x();
  maxX = maxX || lastLayer.sketchObject.absoluteRect().x() + lastLayer.frame.width;
  var padding = getPadding();
  var totalPadding = (layers.length - 1) * padding;
  var scale = (maxX - minX) / (totalWidth + totalPadding);
  var x = minX;
  y = y || firstLayer.sketchObject.absoluteRect().y();
  orderedLayers.forEach(function (layer) {
    layer.sketchObject.setConstrainProportions(0);
    var frame = layer.frame;
    var delta = getDelta(layer, x, y);
    frame.x += delta.x;
    frame.y += delta.y;
    frame.width = Math.round(frame.width * height / frame.height * scale);
    frame.height = Math.round(height * scale);
    layer.frame = frame;
    x += frame.width + padding;
  });
  var frame = lastLayer.frame;
  frame.width = maxX - lastLayer.sketchObject.absoluteRect().x();
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

  if (settings.isRowLayout) {
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

  if (settings.isRowLayout) {
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

  if (settings.isRowLayout) {
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

function getPadding() {
  var padding = Settings.settingForKey('padding');

  if (padding === undefined) {
    padding = 16;
    Settings.setSettingForKey('padding', 16);
  }

  return padding;
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
} // function compareFlowOrder(layerA, layerB) {
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