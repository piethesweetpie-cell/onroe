#target photoshop

(function () {
    var REPO_ROOT = File($.fileName).parent.parent.fsName;
    var BRUSHES_DIR = env("PHOTOSHOP_BRUSHES_DIR", Folder.userData.fsName + "/Adobe/Adobe Photoshop 2026/Presets/Brushes");
    var OUTPUT_DIR = env("PHOTOSHOP_AUDIT_DIR", REPO_ROOT);
    var LOG_PATH = OUTPUT_DIR + "/photoshop-brush-delete-bad.tsv";
    var STATUS_PATH = OUTPUT_DIR + "/photoshop-brush-delete-status.txt";

    var previousDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    var logFile = new File(LOG_PATH);
    logFile.open("w");
    logFile.writeln("file\tsize\tdeleted\tstatus\telapsed_ms\tmessage");
    reopenAppend(logFile);
    writeStatus("STARTED");

    try {
        var folder = new Folder(BRUSHES_DIR);
        var files = folder.getFiles(function (file) {
            return file instanceof File && /\.abr$/i.test(file.name);
        });
        files.sort(function (a, b) {
            var an = displayName(a).toLowerCase();
            var bn = displayName(b).toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            return 0;
        });

        for (var i = 0; i < files.length; i++) {
            testBrush(files[i], i + 1, files.length);
        }

        writeStatus("DONE");
    } catch (outerError) {
        writeStatus("ERROR\t" + field(errorText(outerError)));
    } finally {
        app.displayDialogs = previousDialogs;
        try {
            logFile.close();
        } catch (e) {
        }
    }

    function testBrush(file, index, total) {
        var name = displayName(file);
        var size = file.length;
        var started = new Date().getTime();
        var status = "OK";
        var message = "";
        var deleted = "NO";

        writeStatus("RUNNING\t" + index + "/" + total + "\t" + field(name));

        try {
            app.load(file);
        } catch (loadError) {
            status = "LOAD_FAIL";
            message = errorText(loadError);
        }

        if (status !== "OK") {
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
            field(name) + "\t" +
            size + "\t" +
            deleted + "\t" +
            status + "\t" +
            (new Date().getTime() - started) + "\t" +
            field(message)
        );
        reopenAppend(logFile);
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
