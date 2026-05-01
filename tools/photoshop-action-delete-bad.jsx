#target photoshop

(function () {
    var REPO_ROOT = File($.fileName).parent.parent.fsName;
    var ACTIONS_DIR = env("PHOTOSHOP_ACTIONS_DIR", Folder.userData.fsName + "/Adobe/Adobe Photoshop 2026/Presets/Actions");
    var OUTPUT_DIR = env("PHOTOSHOP_AUDIT_DIR", REPO_ROOT);
    var LOG_PATH = OUTPUT_DIR + "/photoshop-action-delete-bad.tsv";
    var STATUS_PATH = OUTPUT_DIR + "/photoshop-action-delete-status.txt";
    var STOP_FILE_ON_FIRST_FAIL = true;
    var TEST_DOC_PREFIX = "__codex_action_test__";

    var previousDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    var logFile = new File(LOG_PATH);
    logFile.open("w");
    logFile.writeln("file\tsets\tactions_tested\tok\tfail\tdeleted\tstatus\tmessage");
    reopenAppend(logFile);
    writeStatus("STARTED");

    var baselineDocIds = getDocumentIds();

    try {
        var folder = new Folder(ACTIONS_DIR);
        var files = folder.getFiles("*.atn");
        files.sort(function (a, b) {
            var an = displayName(a).toLowerCase();
            var bn = displayName(b).toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            return 0;
        });

        for (var i = 0; i < files.length; i++) {
            auditFile(files[i], i + 1, files.length);
            closeNonBaselineDocuments();
        }

        writeStatus("DONE");
    } catch (outerError) {
        writeStatus("ERROR\t" + field(errorText(outerError)));
    } finally {
        closeNonBaselineDocuments();
        app.displayDialogs = previousDialogs;
        try {
            logFile.close();
        } catch (e) {
        }
    }

    function auditFile(file, ordinal, total) {
        var fileName = displayName(file);
        writeStatus("RUNNING\t" + ordinal + "/" + total + "\t" + field(fileName));

        var beforeCount = listActionSets().length;
        var loadedSets = [];
        var actionsTested = 0;
        var okCount = 0;
        var failCount = 0;
        var status = "OK";
        var message = "";
        var deleted = "NO";

        try {
            app.load(file);
            var afterSets = listActionSets();
            for (var s = beforeCount; s < afterSets.length; s++) {
                loadedSets.push(afterSets[s]);
            }
            if (loadedSets.length === 0) {
                status = "LOAD_FAIL";
                message = "No action set appeared after loading.";
                failCount++;
            }
        } catch (loadError) {
            status = "LOAD_FAIL";
            message = errorText(loadError);
            failCount++;
        }

        for (var setIndex = 0; setIndex < loadedSets.length; setIndex++) {
            var setInfo = loadedSets[setIndex];
            for (var actionIndex = 0; actionIndex < setInfo.actions.length; actionIndex++) {
                var actionName = setInfo.actions[actionIndex];
                actionsTested++;
                try {
                    makeTestDocument();
                    playAction(setInfo.name, actionName);
                    okCount++;
                } catch (actionError) {
                    failCount++;
                    status = "ACTION_FAIL";
                    message = setInfo.name + " / " + actionName + ": " + errorText(actionError);
                }

                closeNonBaselineDocuments();

                if (STOP_FILE_ON_FIRST_FAIL && failCount > 0) {
                    break;
                }
            }

            if (STOP_FILE_ON_FIRST_FAIL && failCount > 0) {
                break;
            }
        }

        unloadSetsAfter(beforeCount);

        if (failCount > 0) {
            try {
                if (file.exists && file.remove()) {
                    deleted = "YES";
                } else {
                    deleted = "FAILED";
                    if (!message) message = "File.remove returned false.";
                }
            } catch (deleteError) {
                deleted = "FAILED";
                message = message + " delete: " + errorText(deleteError);
            }
        }

        logFile.writeln(
            field(fileName) + "\t" +
            loadedSets.length + "\t" +
            actionsTested + "\t" +
            okCount + "\t" +
            failCount + "\t" +
            deleted + "\t" +
            status + "\t" +
            field(message)
        );
        reopenAppend(logFile);
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
            }
        }
    }

    function makeTestDocument() {
        var doc = app.documents.add(1024, 768, 72, TEST_DOC_PREFIX + new Date().getTime(), NewDocumentMode.RGB, DocumentFill.WHITE);
        app.activeDocument = doc;

        fillRect(doc, [[0, 0], [1024, 0], [1024, 768], [0, 768]], 128, 132, 136);
        fillRect(doc, [[80, 80], [450, 80], [450, 650], [80, 650]], 214, 198, 174);
        fillRect(doc, [[520, 130], [890, 130], [890, 620], [520, 620]], 72, 98, 126);
        fillRect(doc, [[280, 220], [760, 220], [760, 520], [280, 520]], 188, 92, 72);
        doc.selection.deselect();
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

    function writeStatus(value) {
        var statusFile = new File(STATUS_PATH);
        statusFile.open("w");
        statusFile.writeln(value);
        statusFile.close();
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

    function errorText(errorObject) {
        if (!errorObject) return "";
        if (errorObject.message) return errorObject.message;
        return String(errorObject);
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
