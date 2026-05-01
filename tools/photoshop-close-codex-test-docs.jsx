#target photoshop

(function () {
    var prefix = "__codex_action_test__";
    for (var i = app.documents.length - 1; i >= 0; i--) {
        var doc = app.documents[i];
        if (doc.name.indexOf(prefix) === 0) {
            doc.close(SaveOptions.DONOTSAVECHANGES);
        }
    }
})();
