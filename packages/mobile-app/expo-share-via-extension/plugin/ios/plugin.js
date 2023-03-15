"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIOSPlugin = void 0;
var withAppEntitlements_1 = require("./withAppEntitlements");
var withShareExtensionConfig_1 = require("./withShareExtensionConfig");
var withShareExtensionXcodeTarget_1 = require("./withShareExtensionXcodeTarget");
var withIOSPlugin = function (config) {
    return (0, withAppEntitlements_1.withAppEntitlements)((0, withShareExtensionConfig_1.withShareExtensionConfig)((0, withShareExtensionXcodeTarget_1.withShareExtensionXcodeTarget)(config)));
};
exports.withIOSPlugin = withIOSPlugin;
//# sourceMappingURL=plugin.js.map