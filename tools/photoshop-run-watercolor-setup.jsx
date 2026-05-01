#target photoshop

(function () {
    var REPO_ROOT = File($.fileName).parent.parent.fsName;
    var ACTION_FILE = env("PHOTOSHOP_WATERCOLOR_ACTION_FILE", Folder.userData.fsName + "/Adobe/Adobe Photoshop 2026/Presets/Actions/Watercolor Artist - Actions.atn");
    var STATUS = new File(env("PHOTOSHOP_AUDIT_DIR", REPO_ROOT) + "/watercolor-setup-status.txt");
    STATUS.open("w");
    STATUS.writeln("START");
    STATUS.close();

    var before = listActionSets().length;
    app.load(new File(ACTION_FILE));

    app.documents.add(1200, 900, 72, "__codex_watercolor_setup_test__", NewDocumentMode.RGB, DocumentFill.WHITE);
    playAction("Watercolor Artist - Photoshop Action Set", "1) SETUP");

    STATUS.open("w");
    STATUS.writeln("DONE");
    STATUS.close();

    unloadSetsAfter(before);

    function playAction(setName, actionName) {
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putName(charIDToTypeID("Actn"), actionName);
        ref.putName(charIDToTypeID("ASet"), setName);
        desc.putReference(charIDToTypeID("null"), ref);
        executeAction(charIDToTypeID("Ply "), desc, DialogModes.ALL);
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
            sets.push(setDesc.getString(charIDToTypeID("Nm  ")));
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

    function env(name, fallback) {
        var value = $.getenv(name);
        return value && value.length ? value : fallback;
    }
})();
