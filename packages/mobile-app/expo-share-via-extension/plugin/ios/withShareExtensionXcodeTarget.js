"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withShareExtensionXcodeTarget = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var constants_1 = require("./constants");
var writeShareExtensionFiles_1 = require("./writeShareExtensionFiles");
var withShareExtensionXcodeTarget = function (config) {
    return (0, config_plugins_1.withXcodeProject)(config, function (config) { return __awaiter(void 0, void 0, void 0, function () {
        var extensionName, platformProjectRoot, scheme, appIdentifier, shareExtensionIdentifier, currentProjectVersion, marketingVersion, infoPlistFilePath, entitlementsFilePath, viewControllerFilePath, storyboardFilePath, pbxProject, target, pbxGroupKey, configurations, key, buildSettingsObj;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("config ", config);
                    extensionName = constants_1.shareExtensionName;
                    platformProjectRoot = config.modRequest.platformProjectRoot;
                    scheme = config.scheme;
                    appIdentifier = (_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier;
                    shareExtensionIdentifier = (0, constants_1.getShareExtensionBundledIdentifier)(appIdentifier);
                    currentProjectVersion = config.ios.buildNumber || '1';
                    marketingVersion = config.version;
                    infoPlistFilePath = (0, writeShareExtensionFiles_1.getShareExtensionInfoFilePath)(platformProjectRoot);
                    entitlementsFilePath = (0, writeShareExtensionFiles_1.getShareExtensionEntitlementsFilePath)(platformProjectRoot);
                    viewControllerFilePath = (0, writeShareExtensionFiles_1.getShareExtensionViewControllerPath)(platformProjectRoot);
                    storyboardFilePath = (0, writeShareExtensionFiles_1.getShareExtensionStoryboardFilePath)(platformProjectRoot);
                    return [4 /*yield*/, (0, writeShareExtensionFiles_1.writeShareExtensionFiles)(platformProjectRoot, scheme, appIdentifier)];
                case 1:
                    _b.sent();
                    pbxProject = config.modResults;
                    target = pbxProject.addTarget(extensionName, 'app_extension', extensionName);
                    // Add a new PBXSourcesBuildPhase for our ShareViewController
                    // (we can't add it to the existing one because an extension is kind of an extra app)
                    pbxProject.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
                    // Add a new PBXResourcesBuildPhase for the Resources used by the Share Extension
                    // (MainInterface.storyboard)
                    pbxProject.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
                    // Create a separate PBXGroup for the shareExtension's files
                    console.log("Creating pbx group , ", extensionName);
                    pbxGroupKey = pbxProject.pbxCreateGroup(extensionName, extensionName);
                    // Add files which are not part of any build phase (plist)
                    pbxProject.addFile(infoPlistFilePath, pbxGroupKey);
                    // Add source files to our PbxGroup and our newly created PBXSourcesBuildPhase
                    pbxProject.addSourceFile(viewControllerFilePath, { target: target.uuid }, pbxGroupKey);
                    //  Add the resource file and include it into the target PbxResourcesBuildPhase and PbxGroup
                    pbxProject.pbxCreateGroup("Resources", extensionName);
                    pbxProject.pbxCreateGroup(extensionName, "Resources");
                    pbxProject.addResourceFile(storyboardFilePath, { target: target.uuid }, pbxGroupKey);
                    configurations = pbxProject.pbxXCBuildConfigurationSection();
                    for (key in configurations) {
                        if (typeof configurations[key].buildSettings !== 'undefined') {
                            buildSettingsObj = configurations[key].buildSettings;
                            if (typeof buildSettingsObj['PRODUCT_NAME'] !== 'undefined' &&
                                buildSettingsObj['PRODUCT_NAME'] === "\"".concat(extensionName, "\"")) {
                                buildSettingsObj['CLANG_ENABLE_MODULES'] = 'YES';
                                buildSettingsObj['INFOPLIST_FILE'] = "\"".concat(infoPlistFilePath, "\"");
                                buildSettingsObj['CODE_SIGN_ENTITLEMENTS'] = "\"".concat(entitlementsFilePath, "\"");
                                buildSettingsObj['CODE_SIGN_STYLE'] = 'Automatic';
                                buildSettingsObj['CURRENT_PROJECT_VERSION'] = "\"".concat(currentProjectVersion, "\"");
                                buildSettingsObj['GENERATE_INFOPLIST_FILE'] = 'YES';
                                buildSettingsObj['MARKETING_VERSION'] = "\"".concat(marketingVersion, "\"");
                                buildSettingsObj['PRODUCT_BUNDLE_IDENTIFIER'] = "\"".concat(shareExtensionIdentifier, "\"");
                                buildSettingsObj['SWIFT_EMIT_LOC_STRINGS'] = 'YES';
                                buildSettingsObj['SWIFT_VERSION'] = '5.0';
                                buildSettingsObj['TARGETED_DEVICE_FAMILY'] = "\"1,2\"";
                            }
                        }
                    }
                    return [2 /*return*/, config];
            }
        });
    }); });
};
exports.withShareExtensionXcodeTarget = withShareExtensionXcodeTarget;
//# sourceMappingURL=withShareExtensionXcodeTarget.js.map