"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_plugins_1 = require("@expo/config-plugins");
var android_1 = require("./android");
var ios_1 = require("./ios");
var pkg = {
    name: "expo-share-via-extension",
    version: "UNVERSIONED",
};
var shareMenuPlugin = (0, config_plugins_1.createRunOncePlugin)(function (config) {
    console.log("config ", config);
    return (0, config_plugins_1.withPlugins)(config, [
        android_1.withAndroidPlugin,
        ios_1.withIOSPlugin,
    ]);
}, pkg.name, pkg.version);
exports.default = shareMenuPlugin;
//# sourceMappingURL=index.js.map