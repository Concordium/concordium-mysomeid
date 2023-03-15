"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShareExtensionBundledIdentifier = exports.getAppGroups = exports.shareExtensionViewControllerFileName = exports.shareExtensionStoryBoardFileName = exports.shareExtensionEntitlementsFileName = exports.shareExtensionInfoFileName = exports.shareExtensionName = void 0;
exports.shareExtensionName = 'ShareExtension';
exports.shareExtensionInfoFileName = "".concat(exports.shareExtensionName, "-Info.plist");
exports.shareExtensionEntitlementsFileName = "".concat(exports.shareExtensionName, ".entitlements");
exports.shareExtensionStoryBoardFileName = 'MainInterface.storyboard';
exports.shareExtensionViewControllerFileName = 'ShareViewController.swift';
var getAppGroups = function (identifier) { return ["group.".concat(identifier)]; };
exports.getAppGroups = getAppGroups;
var getShareExtensionBundledIdentifier = function (appIdentifier) {
    return "".concat(appIdentifier, ".share-extension");
};
exports.getShareExtensionBundledIdentifier = getShareExtensionBundledIdentifier;
//# sourceMappingURL=constants.js.map