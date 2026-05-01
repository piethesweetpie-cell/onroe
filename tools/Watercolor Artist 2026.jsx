#target photoshop

(function () {
    if (app.documents.length === 0) {
        alert("Open an image before running Watercolor Artist 2026.");
        return;
    }

    var previousDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    try {
        var doc = app.activeDocument;
        var source = doc.activeLayer;
        var group = doc.layerSets.add();
        group.name = "Watercolor Artist 2026";

        var wash = duplicateIntoGroup(source, group, "01 Watercolor color wash");
        doc.activeLayer = wash;
        wash.applyMedianNoise(7);
        wash.applyGaussianBlur(2.2);
        try {
            wash.posterize(9);
        } catch (e) {
        }
        wash.opacity = 86;
        wash.blendMode = BlendMode.NORMAL;

        var bloom = duplicateIntoGroup(source, group, "02 Soft pigment bloom");
        doc.activeLayer = bloom;
        bloom.applyGaussianBlur(9);
        try {
            bloom.adjustBrightnessContrast(14, -18);
        } catch (e2) {
        }
        bloom.opacity = 38;
        bloom.blendMode = BlendMode.SOFTLIGHT;

        var edges = duplicateIntoGroup(source, group, "03 Ink and paper edges");
        doc.activeLayer = edges;
        applyFindEdges();
        try {
            edges.desaturate();
        } catch (e3) {
        }
        try {
            edges.adjustBrightnessContrast(28, 42);
        } catch (e4) {
        }
        edges.opacity = 42;
        edges.blendMode = BlendMode.MULTIPLY;

        var detail = duplicateIntoGroup(source, group, "04 Dry brush detail");
        doc.activeLayer = detail;
        applyHighPass(2.4);
        detail.opacity = 34;
        detail.blendMode = BlendMode.SOFTLIGHT;

        var paper = doc.artLayers.add();
        paper.name = "05 Cold press paper texture";
        doc.activeLayer = paper;
        fillWholeDocument(doc, 128, 128, 128);
        try {
            paper.applyAddNoise(18, NoiseDistribution.GAUSSIAN, true);
        } catch (e5) {
        }
        paper.applyGaussianBlur(0.35);
        paper.opacity = 18;
        paper.blendMode = BlendMode.OVERLAY;
        paper.move(group, ElementPlacement.INSIDE);

        var tint = doc.artLayers.add();
        tint.name = "06 Warm watercolor paper tint";
        doc.activeLayer = tint;
        fillWholeDocument(doc, 248, 242, 226);
        tint.opacity = 16;
        tint.blendMode = BlendMode.MULTIPLY;
        tint.move(group, ElementPlacement.INSIDE);

        doc.activeLayer = group;
    } finally {
        app.displayDialogs = previousDialogs;
    }

    function duplicateIntoGroup(layer, group, name) {
        var copy = layer.duplicate();
        copy.name = name;
        copy.move(group, ElementPlacement.INSIDE);
        return copy;
    }

    function fillWholeDocument(doc, r, g, b) {
        var color = new SolidColor();
        color.rgb.red = r;
        color.rgb.green = g;
        color.rgb.blue = b;

        doc.selection.select([
            [0, 0],
            [doc.width.as("px"), 0],
            [doc.width.as("px"), doc.height.as("px")],
            [0, doc.height.as("px")]
        ]);
        doc.selection.fill(color);
        doc.selection.deselect();
    }

    function applyFindEdges() {
        executeAction(charIDToTypeID("FndE"), undefined, DialogModes.NO);
    }

    function applyHighPass(radius) {
        var desc = new ActionDescriptor();
        desc.putUnitDouble(charIDToTypeID("Rds "), charIDToTypeID("#Pxl"), radius);
        executeAction(charIDToTypeID("HghP"), desc, DialogModes.NO);
    }
})();
