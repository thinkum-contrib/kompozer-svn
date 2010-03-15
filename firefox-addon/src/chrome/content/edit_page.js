/* oncommand event */
function edit_page() {

    var url = getWebNavigation().currentURI.spec;

    // clue to Cozmos server to send page raw.
    if (url.substr(0, 4) == "http") {
        if (url.indexOf("?") > 0) {
            url = url + "&editMode=true";
        } else {
            url = url + "?editMode=true";
        }
    }

    //window.alert("url= " + url);

    var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
    var args;
    var found = false;

    // Mac OS X

    try {
        file.initWithPath("/Applications/KompoZer.app/Contents/MacOS/kompozer-bin");
        if (file.exists()) {
            found = true;
            args = new Array(url);
        }
    } catch (ex) {
    }

    // Windows
    if (!found) {
        try {
            file.initWithPath("C:\\Program Files\\KompoZer\\kompozer.exe");
            if (file.exists()) {
                found = true;
                args = new Array(url);
            }
        } catch (ex) {
        }
    }

    // Linux

    if (!found) {
         try {
             file.initWithPath("/usr/local/kompozer/kompozer");
             if (file.exists()) {
                 found = true;
                 args = new Array(url);
             }
         } catch (ex) {
         }
     }

    if (found) {
        var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
        process.init(file);
        process.run(false, args, args.length);
    } else {
        window.alert("No editor found. Please install KompoZer as per instructions on http://kompozer.sf.net");
    }

}
