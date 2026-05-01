#target photoshop

(function () {
    var repoRoot = File($.fileName).parent.parent.fsName;
    var outputDir = env("PHOTOSHOP_AUDIT_DIR", repoRoot);
    var status = new File(outputDir + "/watercolor-artist-2026-test.txt");
    status.open("w");
    status.writeln("START");
    status.close();

    var baseline = [];
    for (var i = 0; i < app.documents.length; i++) {
        baseline.push(app.documents[i].id);
    }

    try {
        var doc = app.documents.add(1000, 750, 72, "__codex_watercolor_2026_test__", NewDocumentMode.RGB, DocumentFill.WHITE);
        fillRect(doc, [[0, 0], [1000, 0], [1000, 750], [0, 750]], 134, 146, 158);
        fillRect(doc, [[100, 90], [460, 90], [460, 660], [100, 660]], 220, 194, 156);
        fillRect(doc, [[520, 130], [900, 130], [900, 620], [520, 620]], 80, 110, 140);
        fillRect(doc, [[310, 220], [730, 220], [730, 520], [310, 520]], 190, 94, 78);
        doc.selection.deselect();

        $.evalFile(new File(File($.fileName).parent.fsName + "/Watercolor Artist 2026.jsx"));

        status.open("w");
        status.writeln("DONE");
        status.close();
    } catch (e) {
        status.open("w");
        status.writeln("ERROR\t" + (e.message || String(e)));
        status.close();
    } finally {
        for (var d = app.documents.length - 1; d >= 0; d--) {
            var current = app.documents[d];
            if (!contains(baseline, current.id)) {
                current.close(SaveOptions.DONOTSAVECHANGES);
            }
        }
    }

    function fillRect(doc, points, r, g, b) {
        var color = new SolidColor();
        color.rgb.red = r;
        color.rgb.green = g;
        color.rgb.blue = b;
        doc.selection.select(points);
        doc.selection.fill(color);
    }

    function contains(items, value) {
        for (var i = 0; i < items.length; i++) {
            if (items[i] === value) return true;
        }
        return false;
    }

    function env(name, fallback) {
        var value = $.getenv(name);
        return value && value.length ? value : fallback;
    }
})();
