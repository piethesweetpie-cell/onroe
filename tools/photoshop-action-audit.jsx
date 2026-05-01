#target photoshop

(function () {
    var REPO_ROOT = File($.fileName).parent.parent.fsName;
    var ACTIONS_DIR = env("PHOTOSHOP_ACTIONS_DIR", Folder.userData.fsName + "/Adobe/Adobe Photoshop 2026/Presets/Actions");
    var OUTPUT_DIR = env("PHOTOSHOP_AUDIT_DIR", REPO_ROOT);
    var LOG_PATH = OUTPUT_DIR + "/photoshop-action-audit.tsv";
    var SUMMARY_PATH = OUTPUT_DIR + "/photoshop-action-summary.tsv";
    var MAX_FILES = 0;
    var STOP_FILE_ON_FIRST_FAIL = true;
    var TEST_DOC_PREFIX = "__codex_action_test__";

    var previousDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    var logFile = new File(LOG_PATH);
    var summaryFile = new File(SUMMARY_PATH);
    logFile.open("w");
    summaryFile.open("w");
    logFile.writeln("file\tset\taction\tstatus\telapsed_ms\tmessage");
    summaryFile.writeln("file\tsets\tactions\tok\tfail\tload_status\tmessage");
    reopenAppend(logFile);
    reopenAppend(summaryFile);

    var baselineDocIds = getDocumentIds();

    try {
        var folder = new Folder(ACTIONS_DIR);
        var files = folder.getFiles("*.atn");
        files.sort(function (a, b) {
            var an = a.name.toLowerCase();
            var bn = b.name.toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            return 0;
        });

        for (var i = 0; i < files.length; i++) {
            if (MAX_FILES > 0 && i >= MAX_FILES) break;
            auditFile(files[i]);
            closeNonBaselineDocuments();
        }
    } catch (outerError) {
        logFile.writeln("_script\t\t\tFAIL\t0\t" + field(errorText(outerError)));
    } finally {
        closeNonBaselineDocuments();
        app.displayDialogs = previousDialogs;
        logFile.close();
        summaryFile.close();
    }

    function auditFile(file) {
        var beforeSets = listActionSets();
        var beforeCount = beforeSets.length;
        var loadedSets = [];
        var actionCount = 0;
        var okCount = 0;
        var failCount = 0;
        var loadStatus = "OK";
        var loadMessage = "";

        try {
            app.load(file);
            var afterSets = listActionSets();
            for (var s = beforeCount; s < afterSets.length; s++) {
                loadedSets.push(afterSets[s]);
            }
            if (loadedSets.length === 0) {
                loadStatus = "FAIL";
                loadMessage = "No action set appeared after loading.";
            }
        } catch (loadError) {
            loadStatus = "FAIL";
            loadMessage = errorText(loadError);
        }

        for (var setIndex = 0; setIndex < loadedSets.length; setIndex++) {
            var setInfo = loadedSets[setIndex];
            for (var actionIndex = 0; actionIndex < setInfo.actions.length; actionIndex++) {
                var actionName = setInfo.actions[actionIndex];
                actionCount++;
                var started = new Date().getTime();
                var status = "OK";
                var message = "";

                try {
                    makeTestDocument();
                    playAction(setInfo.name, actionName);
                    okCount++;
                } catch (actionError) {
                    status = "FAIL";
                    message = errorText(actionError);
                    failCount++;
                }

                var elapsed = new Date().getTime() - started;
                logFile.writeln(
                    field(displayName(file)) + "\t" +
                    field(setInfo.name) + "\t" +
                    field(actionName) + "\t" +
                    status + "\t" +
                    elapsed + "\t" +
                    field(message)
                );
                reopenAppend(logFile);
                closeNonBaselineDocuments();

                if (STOP_FILE_ON_FIRST_FAIL && status === "FAIL") {
                    break;
                }
            }

            if (STOP_FILE_ON_FIRST_FAIL && failCount > 0) {
                break;
            }
        }

        summaryFile.writeln(
            field(displayName(file)) + "\t" +
            loadedSets.length + "\t" +
            actionCount + "\t" +
            okCount + "\t" +
            failCount + "\t" +
            loadStatus + "\t" +
            field(loadMessage)
        );
        reopenAppend(summaryFile);
        unloadSetsAfter(beforeCount);
    }

    function playAction(setName, actionName) {
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putName(charIDToTypeID("Actn"), actionName);
        ref.putName(charIDToTypeID("ASet"), setName);
        desc.putReference(charIDToTypeID("null"), ref);
        executeAction(charIDToTypeID("Ply "), desc, DialogModes.NO);
    }

    function listActionSets() {
        var sets = [];
        for (var i = 1; ; i++) {
            var setRef = new ActionReference();
            setRef.putIndex(charIDToTypeID("ASet"), i);
            var setDesc;
            try {
                setDesc = executeActionGet(setRef);
            } catch (e) {
                break;
            }

            var setName = setDesc.getString(charIDToTypeID("Nm  "));
            var count = 0;
            if (setDesc.hasKey(charIDToTypeID("NmbC"))) {
                count = setDesc.getInteger(charIDToTypeID("NmbC"));
            }

            var actions = [];
            for (var j = 1; j <= count; j++) {
                var actionRef = new ActionReference();
                actionRef.putIndex(charIDToTypeID("Actn"), j);
                actionRef.putIndex(charIDToTypeID("ASet"), i);
                try {
                    var actionDesc = executeActionGet(actionRef);
                    actions.push(actionDesc.getString(charIDToTypeID("Nm  ")));
                } catch (actionReadError) {
                    actions.push("__unreadable_action_" + j);
                }
            }

            sets.push({ index: i, name: setName, actions: actions });
        }
        return sets;
    }

    function unloadSetsAfter(beforeCount) {
        var sets = listActionSets();
        for (var i = sets.length; i > beforeCount; i--) {
            try {
                var desc = new ActionDescriptor();
                var ref = new ActionReference();
                ref.putIndex(charIDToTypeID("ASet"), i);
                desc.putReference(charIDToTypeID("null"), ref);
                executeAction(charIDToTypeID("Dlt "), desc, DialogModes.NO);
            } catch (e) {
                logFile.writeln("_unload\tset_index_" + i + "\t\tFAIL\t0\t" + field(errorText(e)));
            }
        }
    }

    function makeTestDocument() {
        var doc = app.documents.add(1024, 768, 72, TEST_DOC_PREFIX + new Date().getTime(), NewDocumentMode.RGB, DocumentFill.WHITE);
        app.activeDocument = doc;

        var base = new SolidColor();
        base.rgb.red = 128;
        base.rgb.green = 132;
        base.rgb.blue = 136;
        doc.selection.select([[0, 0], [1024, 0], [1024, 768], [0, 768]]);
        doc.selection.fill(base);
        doc.selection.deselect();

        fillRect(doc, [[80, 80], [450, 80], [450, 650], [80, 650]], 214, 198, 174);
        fillRect(doc, [[520, 130], [890, 130], [890, 620], [520, 620]], 72, 98, 126);
        fillRect(doc, [[280, 220], [760, 220], [760, 520], [280, 520]], 188, 92, 72);
        doc.selection.deselect();

        try {
            doc.activeLayer = doc.backgroundLayer;
        } catch (e) {
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

    function getDocumentIds() {
        var ids = [];
        for (var i = 0; i < app.documents.length; i++) {
            try {
                ids.push(app.documents[i].id);
            } catch (e) {
            }
        }
        return ids;
    }

    function closeNonBaselineDocuments() {
        for (var i = app.documents.length - 1; i >= 0; i--) {
            var doc = app.documents[i];
            var id = null;
            try {
                id = doc.id;
            } catch (e) {
            }
            if (!containsId(baselineDocIds, id)) {
                try {
                    doc.close(SaveOptions.DONOTSAVECHANGES);
                } catch (closeError) {
                }
            }
        }
    }

    function containsId(ids, id) {
        for (var i = 0; i < ids.length; i++) {
            if (ids[i] === id) return true;
        }
        return false;
    }

    function errorText(errorObject) {
        if (!errorObject) return "";
        if (errorObject.message) return errorObject.message;
        return String(errorObject);
    }

    function reopenAppend(file) {
        try {
            file.close();
            file.open("a");
        } catch (e) {
        }
    }

    function displayName(file) {
        try {
            return decodeURI(file.name);
        } catch (e) {
            return file.name;
        }
    }

    function field(value) {
        if (value === null || value === undefined) return "";
        var s = String(value);
        s = s.replace(/\r/g, " ");
        s = s.replace(/\n/g, " ");
        s = s.replace(/\t/g, " ");
        return s;
    }

    function env(name, fallback) {
        var value = $.getenv(name);
        return value && value.length ? value : fallback;
    }
})();
