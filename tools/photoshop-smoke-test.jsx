#target photoshop

(function () {
    var repoRoot = File($.fileName).parent.parent.fsName;
    var outputDir = env("PHOTOSHOP_AUDIT_DIR", repoRoot);
    var logFile = new File(outputDir + "/photoshop-smoke-test.log");
    logFile.open("w");
    logFile.writeln("version=" + app.version);
    logFile.writeln("documents=" + app.documents.length);
    logFile.close();

    function env(name, fallback) {
        var value = $.getenv(name);
        return value && value.length ? value : fallback;
    }
})();
