import UI from "sketch/ui"
import DOM from "sketch/dom"

import { options } from "./options"

export function onRandomizeAspectRatios(context) {
    const document = DOM.getSelectedDocument(),
        selection = document.selectedLayers

    if (selection.length === 0) {
        UI.message("Select one or more layers")
    } else {
        let bounds = getBoundingBox(selection.layers)
        let groups = findGroups(selection.layers)

        groups.forEach(group => {
            randomizeAspectRatios(group, bounds)
        })
    }
}

export function onFit(context) {
    const document = DOM.getSelectedDocument(),
        selection = document.selectedLayers

    if (selection.length === 0) {
        UI.message("Select one or more layers")
    } else {
        let bounds = getBoundingBox(selection.layers)
        let groups = findGroups(selection.layers)

        if (options.isRowLayout) {
            if (options.hasWidthLimit) {
                bounds.width = options.maxWidth
            }

            let y = bounds.y
            groups.forEach(group => {
                fitLayersInRows(group, bounds, y)
                y =
                    group[0].sketchObject.absoluteRect().y() +
                    group[0].frame.height +
                    options.padding
            })
        } else {
            let x = bounds.x
            groups.forEach(group => {
                fitLayersInColumns(group, bounds, x)
                x =
                    group[0].sketchObject.absoluteRect().x() +
                    group[0].frame.width +
                    options.padding
            })
        }
    }
}

function randomizeAspectRatios(layers, bounds) {
    let orderedLayers

    let x = bounds.x,
        y = bounds.y

    if (options.isRowLayout) {
        orderedLayers = layers.sort(
            (a, b) =>
                a.sketchObject.absoluteRect().x() -
                b.sketchObject.absoluteRect().x()
        )
        y = orderedLayers[0].sketchObject.absoluteRect().y()
    } else {
        orderedLayers = layers.sort(
            (a, b) =>
                a.sketchObject.absoluteRect().y() -
                b.sketchObject.absoluteRect().y()
        )
        x = orderedLayers[0].sketchObject.absoluteRect().x()
    }

    orderedLayers.forEach(layer => {
        layer.sketchObject.setConstrainProportions(0)

        let ratio = randomAspectRatio()
        let delta = getDelta(layer, x, y)
        let frame = layer.frame

        frame.x += delta.x
        frame.y += delta.y

        if (options.isRowLayout) {
            frame.width = Math.round(frame.height * ratio)
            x += frame.width + options.padding
        } else {
            frame.height = Math.round(frame.width / ratio)
            y += frame.height + options.padding
        }

        layer.frame = frame
    })
}

function randomAspectRatio() {
    const aspectRatios = [
        1,
        10 / 8,
        4 / 3,
        7 / 5,
        3 / 2,
        16 / 9,
        2 / 3,
        5 / 7,
        3 / 4,
        8 / 10,
    ]
    return aspectRatios[Math.floor(Math.random() * aspectRatios.length)]
}

function fitLayersInRows(layers, bounds, y) {
    let min = bounds.x
    let max = bounds.x + bounds.width

    let orderedLayers = layers.sort(
        (a, b) =>
            a.sketchObject.absoluteRect().x() -
            b.sketchObject.absoluteRect().x()
    )
    let lastLayer = orderedLayers[orderedLayers.length - 1]

    let height = Math.round(median(layers.map(layer => layer.frame.height)))
    let widths = layers.map(
        layer => (layer.frame.width * height) / layer.frame.height
    )
    let totalWidth = widths.reduce((total, current) => total + current)

    let totalPadding = (layers.length - 1) * options.padding
    let scale = (max - min) / (totalWidth + totalPadding)

    let x = min

    orderedLayers.forEach(layer => {
        layer.sketchObject.setConstrainProportions(0)

        let delta = getDelta(layer, x, y)
        let frame = layer.frame

        frame.x += delta.x
        frame.y += delta.y

        frame.width = Math.round(
            ((frame.width * height) / frame.height) * scale
        )
        frame.height = Math.round(height * scale)
        x += frame.width + options.padding

        layer.frame = frame
    })

    let frame = lastLayer.frame
    frame.width = max - lastLayer.sketchObject.absoluteRect().x()
    lastLayer.frame = frame
}

function fitLayersInColumns(layers, bounds, x) {
    let min = bounds.y
    let max = bounds.y + bounds.height

    let orderedLayers = layers.sort(
        (a, b) =>
            a.sketchObject.absoluteRect().y() -
            b.sketchObject.absoluteRect().y()
    )
    let lastLayer = orderedLayers[orderedLayers.length - 1]

    let width = Math.round(median(layers.map(layer => layer.frame.width)))
    let heights = layers.map(
        layer => (layer.frame.height * width) / layer.frame.width
    )
    let totalHeight = heights.reduce((total, current) => total + current)

    let totalPadding = (layers.length - 1) * options.padding
    let scale = (max - min) / (totalHeight + totalPadding)

    let y = min

    orderedLayers.forEach(layer => {
        layer.sketchObject.setConstrainProportions(0)

        let delta = getDelta(layer, x, y)
        let frame = layer.frame

        frame.x += delta.x
        frame.y += delta.y

        frame.height = Math.round(
            ((frame.height * width) / frame.width) * scale
        )
        frame.width = Math.round(width * scale)
        y += frame.height + options.padding

        layer.frame = frame
    })

    let frame = lastLayer.frame
    frame.height = max - lastLayer.sketchObject.absoluteRect().y()
    lastLayer.frame = frame
}

function getDelta(layer, x, y) {
    let absoluteRect = layer.sketchObject.absoluteRect()
    let deltaX = x - absoluteRect.x()
    let deltaY = y - absoluteRect.y()
    return { x: deltaX, y: deltaY }
}

function findGroups(layers) {
    let groups = []
    let remainingLayers = new Set(layers)

    let range
    if (options.isRowLayout) {
        range = Math.round(median(layers.map(layer => layer.frame.height)))
    } else {
        range = Math.round(median(layers.map(layer => layer.frame.width)))
    }

    while (remainingLayers.size > 0) {
        let largestGroup = []
        remainingLayers.forEach(layer => {
            let group = findLayersInGroup(remainingLayers, layer, range)
            if (group.length > largestGroup.length) {
                largestGroup = group
            }
        })

        largestGroup.forEach(layer => {
            remainingLayers.delete(layer)
        })

        groups.push(largestGroup)
    }

    if (options.isRowLayout) {
        return groups.sort(
            (groupA, groupB) =>
                groupA[0].sketchObject.absoluteRect().y() -
                groupB[0].sketchObject.absoluteRect().y()
        )
    } else {
        return groups.sort(
            (groupA, groupB) =>
                groupA[0].sketchObject.absoluteRect().x() -
                groupB[0].sketchObject.absoluteRect().x()
        )
    }
}

function findLayersInGroup(layers, referenceLayer, range) {
    let found = []
    let rowCentre = getLayerCentre(referenceLayer)

    if (options.isRowLayout) {
        let lower = rowCentre.y - range / 2
        let upper = rowCentre.y + range / 2

        layers.forEach(layer => {
            let centre = getLayerCentre(layer)
            if (centre.y > lower && centre.y < upper) {
                found.push(layer)
            }
        })
    } else {
        let lower = rowCentre.x - range / 2
        let upper = rowCentre.x + range / 2

        layers.forEach(layer => {
            let centre = getLayerCentre(layer)
            if (centre.x > lower && centre.x < upper) {
                found.push(layer)
            }
        })
    }

    return found
}

function median(values) {
    values.sort((a, b) => a - b)
    let half = Math.floor(values.length / 2)

    if (values.length % 2) {
        return values[half]
    } else {
        return (values[half - 1] + values[half]) / 2.0
    }
}

function getBoundingBox(layers) {
    let lefts = layers
        .map(layer => layer.sketchObject.absoluteRect().x())
        .sort((a, b) => a - b)
    let rights = layers
        .map(layer => layer.sketchObject.absoluteRect().x() + layer.frame.width)
        .sort((a, b) => a - b)
    let tops = layers
        .map(layer => layer.sketchObject.absoluteRect().y())
        .sort((a, b) => a - b)
    let bottoms = layers
        .map(
            layer => layer.sketchObject.absoluteRect().y() + layer.frame.height
        )
        .sort((a, b) => a - b)
    return {
        x: lefts[0],
        y: tops[0],
        width: rights[layers.length - 1] - lefts[0],
        height: bottoms[layers.length - 1] - tops[0],
    }
}

function getLayerCentre(layer) {
    return {
        x: layer.sketchObject.absoluteRect().x() + layer.frame.width / 2,
        y: layer.sketchObject.absoluteRect().y() + layer.frame.height / 2,
    }
}
