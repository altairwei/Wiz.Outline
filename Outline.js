
function OnOutlineButtonClicked() {
    var pluginPath = objApp.GetPluginPathByScriptFileName("Outline.js");
    var bookmarksListHtmlFileName = pluginPath + "Outline.htm";
    //
    var rect = objWindow.GetToolButtonRect("document", "OutlineButton");
    var arr = rect.split(',');
    objWindow.ShowSelectorWindow(bookmarksListHtmlFileName, (parseInt(arr[0]) + parseInt(arr[2])) / 2, arr[3], 400, 500, "");
}
function InitOutlineButton() {
    var pluginPath = objApp.GetPluginPathByScriptFileName("Outline.js");
    var languangeFileName = pluginPath + "plugin.ini";
    var buttonText = objApp.LoadStringFromFile(languangeFileName, "strOutline");
    objWindow.AddToolButton("document", "OutlineButton", buttonText, pluginPath + "outline.ico", "OnOutlineButtonClicked");
}

InitOutlineButton();
