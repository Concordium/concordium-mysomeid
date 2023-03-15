"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withShareExtensionConfig = void 0;
var constants_1 = require("./constants");
var writeShareExtensionFiles_1 = require("./writeShareExtensionFiles");
var withShareExtensionConfig = function (config) {
    var _a, _b, _c, _d, _e, _f;
    console.log("Adding share extensino config");
    var extName = constants_1.shareExtensionName;
    var appIdentifier = config.ios.bundleIdentifier;
    var shareExtensionIdentifier = (0, constants_1.getShareExtensionBundledIdentifier)(appIdentifier);
    var extConfigIndex = null;
    (_f = (_e = (_d = (_c = (_b = (_a = config.extra) === null || _a === void 0 ? void 0 : _a.eas) === null || _b === void 0 ? void 0 : _b.build) === null || _c === void 0 ? void 0 : _c.experimental) === null || _d === void 0 ? void 0 : _d.ios) === null || _e === void 0 ? void 0 : _e.appExtensions) === null || _f === void 0 ? void 0 : _f.forEach(function (ext, index) {
        ext.targetName === extName && (extConfigIndex = index);
    });
    if (!config.extra) {
        config.extra = {};
    }
    if (!extConfigIndex) {
        if (!config.extra.eas) {
            config.extra.eas = {};
        }
        if (!config.extra.eas.build) {
            config.extra.eas.build = {};
        }
        if (!config.extra.eas.build.experimental) {
            config.extra.eas.build.experimental = {};
        }
        if (!config.extra.eas.build.experimental.ios) {
            config.extra.eas.build.experimental.ios = {};
        }
        if (!config.extra.eas.build.experimental.ios.appExtensions) {
            config.extra.eas.build.experimental.ios.appExtensions = [];
        }
        config.extra.eas.build.experimental.ios.appExtensions.push({
            targetName: extName,
            bundleIdentifier: shareExtensionIdentifier,
        });
        extConfigIndex = 0;
    }
    var extConfig = config.extra.eas.build.experimental.ios.appExtensions[extConfigIndex];
    extConfig.entitlements = __assign(__assign({}, extConfig.entitlements), (0, writeShareExtensionFiles_1.getShareExtensionEntitlements)(appIdentifier));
    return config;
};
exports.withShareExtensionConfig = withShareExtensionConfig;
//# sourceMappingURL=withShareExtensionConfig.js.map