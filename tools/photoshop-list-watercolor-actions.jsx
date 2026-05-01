#target photoshop

(function () {
    var REPO_ROOT = File($.fileName).parent.parent.fsName;
    var ACTION_FILE = env("PHOTOSHOP_WATERCOLOR_ACTION_FILE", Folder.userData.fsName + "/Adobe/Adobe Photoshop 2026/Presets/Actions/Watercolor Artist - Actions.atn");
    var OUT = env("PHOTOSHOP_AUDIT_DIR", REPO_ROOT) + "/watercolor-artist-actions-list.tsv";
    var log = new File(OUT);
    log.open("w");
    log.writeln("set\taction");

    var before = listActionSets().length;
    app.load(new File(ACTION_FILE));
    var after = listActionSets();

    for (var i = before; i < after.length; i++) {
        for (var j = 0; j < after[i].actions.length; j++) {
            log.writeln(after[i].name + "\t" + after[i].actions[j]);
        }
    }

    log.close();
    unloadSetsAfter(before);

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
            sets.push({ name: setName, actions: actions });
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
