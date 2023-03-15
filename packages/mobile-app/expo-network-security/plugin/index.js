"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_plugins_1 = require("@expo/config-plugins");
var android_1 = require("./android");
var pkg = {
    name: "expo-network-security",
    version: "UNVERSIONED",
};
var shareMenuPlugin = (0, config_plugins_1.createRunOncePlugin)(function (config) {
    console.log("config ", config);
    return (0, config_plugins_1.withPlugins)(config, [
        android_1.withAndroidPlugin,
        // withIOSPlugin,
    ]);
}, pkg.name, pkg.version);
exports.default = shareMenuPlugin;
//# sourceMappingURL=index.js.map