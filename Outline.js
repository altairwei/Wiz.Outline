
function OnOutlineButtonClicked() {
    var pluginPath = objApp.GetPluginPathByScriptFileName("Outline.js");
    var bookmarksListHtmlFileName = pluginPath + "Outline.htm";
    //
    var rect = objWindow.GetToolButtonRect("document", "OutlineButton");
    var arr = rect.split(',');
    objWindow.ShowSelectorWindow(bookmarksListHtmlFileName, arr[0], arr[3], 500, 700, "");
}
function InitOutlineButton() {
    var pluginPath = objApp.GetPluginPathByScriptFileName("Outline.js");
    var languangeFileName = pluginPath + "plugin.ini";
    var buttonText = objApp.LoadStringFromFile(languangeFileName, "strOutline");
    objWindow.AddToolButton("document", "OutlineButton", buttonText, "", "OnOutlineButtonClicked");
}

InitOutlineButton();
