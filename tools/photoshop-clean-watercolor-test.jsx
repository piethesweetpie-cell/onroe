#target photoshop

(function () {
    for (var i = app.documents.length - 1; i >= 0; i--) {
        var doc = app.documents[i];
        if (doc.name.indexOf("__codex_") === 0) {
            doc.close(SaveOptions.DONOTSAVECHANGES);
        }
    }

    for (var setIndex = actionSetCount(); setIndex >= 1; setIndex--) {
        var name = actionSetName(setIndex);
        if (name === "Watercolor Artist - Photoshop Action Set") {
            try {
                var desc = new ActionDescriptor();
                var ref = new ActionReference();
                ref.putIndex(charIDToTypeID("ASet"), setIndex);
                desc.putReference(charIDToTypeID("null"), ref);
                executeAction(charIDToTypeID("Dlt "), desc, DialogModes.NO);
            } catch (e) {
            }
        }
    }

    function actionSetCount() {
        var count = 0;
        for (var i = 1; ; i++) {
            var ref = new ActionReference();
            ref.putIndex(charIDToTypeID("ASet"), i);
            try {
                executeActionGet(ref);
                count++;
            } catch (e) {
                break;
            }
        }
        return count;
    }

    function actionSetName(index) {
        var ref = new ActionReference();
        ref.putIndex(charIDToTypeID("ASet"), index);
        return executeActionGet(ref).getString(charIDToTypeID("Nm  "));
    }
})();
