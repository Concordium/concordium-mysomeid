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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShareExtensionViewControllerContent = exports.getShareExtensionViewControllerPath = exports.getShareExtensionStoryBoardContent = exports.getShareExtensionStoryboardFilePath = exports.getShareExtensionInfoContent = exports.getShareExtensionInfoFilePath = exports.getShareExtensionEntitlementsContent = exports.getShareExtensionEntitlements = exports.getShareExtensionEntitlementsFilePath = exports.writeShareExtensionFiles = void 0;
var node_path_1 = __importDefault(require("node:path"));
var node_fs_1 = __importDefault(require("node:fs"));
var plist_1 = __importDefault(require("@expo/plist"));
var constants_1 = require("./constants");
function writeShareExtensionFiles(platformProjectRoot, scheme, appIdentifier) {
    return __awaiter(this, void 0, void 0, function () {
        var infoPlistFilePath, infoPlistContent, entitlementsFilePath, entitlementsContent, storyboardFilePath, storyboardContent, viewControllerFilePath, viewControllerContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    infoPlistFilePath = getShareExtensionInfoFilePath(platformProjectRoot);
                    infoPlistContent = getShareExtensionInfoContent();
                    return [4 /*yield*/, node_fs_1.default.promises.mkdir(node_path_1.default.dirname(infoPlistFilePath), { recursive: true })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, node_fs_1.default.promises.writeFile(infoPlistFilePath, infoPlistContent)];
                case 2:
                    _a.sent();
                    entitlementsFilePath = getShareExtensionEntitlementsFilePath(platformProjectRoot);
                    entitlementsContent = getShareExtensionEntitlementsContent(appIdentifier);
                    return [4 /*yield*/, node_fs_1.default.promises.writeFile(entitlementsFilePath, entitlementsContent)];
                case 3:
                    _a.sent();
                    storyboardFilePath = getShareExtensionStoryboardFilePath(platformProjectRoot);
                    storyboardContent = getShareExtensionStoryBoardContent();
                    console.log("creating story board file :", storyboardFilePath);
                    return [4 /*yield*/, node_fs_1.default.promises.writeFile(storyboardFilePath, storyboardContent)];
                case 4:
                    _a.sent();
                    viewControllerFilePath = getShareExtensionViewControllerPath(platformProjectRoot);
                    viewControllerContent = getShareExtensionViewControllerContent(scheme);
                    return [4 /*yield*/, node_fs_1.default.promises.writeFile(viewControllerFilePath, viewControllerContent)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.writeShareExtensionFiles = writeShareExtensionFiles;
//: [root]/ios/ShareExtension/ShareExtension-Entitlements.plist
function getShareExtensionEntitlementsFilePath(platformProjectRoot) {
    return node_path_1.default.join(platformProjectRoot, constants_1.shareExtensionName, constants_1.shareExtensionEntitlementsFileName);
}
exports.getShareExtensionEntitlementsFilePath = getShareExtensionEntitlementsFilePath;
function getShareExtensionEntitlements(appIdentifier) {
    return {
        "com.apple.security.application-groups": (0, constants_1.getAppGroups)(appIdentifier),
    };
}
exports.getShareExtensionEntitlements = getShareExtensionEntitlements;
function getShareExtensionEntitlementsContent(appIdentifier) {
    return plist_1.default.build(getShareExtensionEntitlements(appIdentifier));
}
exports.getShareExtensionEntitlementsContent = getShareExtensionEntitlementsContent;
//: [root]/ios/ShareExtension/ShareExtension-Info.plist
function getShareExtensionInfoFilePath(platformProjectRoot) {
    return node_path_1.default.join(platformProjectRoot, constants_1.shareExtensionName, constants_1.shareExtensionInfoFileName);
}
exports.getShareExtensionInfoFilePath = getShareExtensionInfoFilePath;
function getShareExtensionInfoContent() {
    return plist_1.default.build({
        CFBundleName: "$(PRODUCT_NAME)",
        CFBundleDisplayName: "Share Extension",
        CFBundleIdentifier: "$(PRODUCT_BUNDLE_IDENTIFIER)",
        CFBundleDevelopmentRegion: "$(DEVELOPMENT_LANGUAGE)",
        CFBundleExecutable: "$(EXECUTABLE_NAME)",
        CFBundleInfoDictionaryVersion: "6.0",
        CFBundlePackageType: "$(PRODUCT_BUNDLE_PACKAGE_TYPE)",
        NSExtension: {
            NSExtensionAttributes: {
                /* NSExtensionActivationRule: {
                  NSExtensionActivationSupportsWebURLWithMaxCount: 1,
                  NSExtensionActivationSupportsWebPageWithMaxCount: 1,
                },*/
                NSExtensionActivationRule: "TRUEPREDICATE",
            },
            NSExtensionMainStoryboard: "MainInterface",
            NSExtensionPointIdentifier: "com.apple.share-services",
        },
    });
}
exports.getShareExtensionInfoContent = getShareExtensionInfoContent;
//: [root]/ios/ShareExtension/ShareExtension-Info.plist
function getShareExtensionStoryboardFilePath(platformProjectRoot) {
    return node_path_1.default.join(platformProjectRoot, constants_1.shareExtensionName, constants_1.shareExtensionStoryBoardFileName);
}
exports.getShareExtensionStoryboardFilePath = getShareExtensionStoryboardFilePath;
function getShareExtensionStoryBoardContent() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n  <document type=\"com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB\" version=\"3.0\" toolsVersion=\"13122.16\" targetRuntime=\"iOS.CocoaTouch\" propertyAccessControl=\"none\" useAutolayout=\"YES\" useTraitCollections=\"YES\" useSafeAreas=\"YES\" colorMatched=\"YES\" initialViewController=\"j1y-V4-xli\">\n      <dependencies>\n          <plugIn identifier=\"com.apple.InterfaceBuilder.IBCocoaTouchPlugin\" version=\"13104.12\"/>\n          <capability name=\"Safe area layout guides\" minToolsVersion=\"9.0\"/>\n          <capability name=\"documents saved in the Xcode 8 format\" minToolsVersion=\"8.0\"/>\n      </dependencies>\n      <scenes>\n          <!--Share View Controller-->\n          <scene sceneID=\"ceB-am-kn3\">\n              <objects>\n                  <viewController id=\"j1y-V4-xli\" customClass=\"ShareViewController\" customModuleProvider=\"target\" sceneMemberID=\"viewController\">\n                      <view key=\"view\" opaque=\"NO\" contentMode=\"scaleToFill\" id=\"wbc-yd-nQP\">\n                          <rect key=\"frame\" x=\"0.0\" y=\"0.0\" width=\"375\" height=\"667\"/>\n                          <autoresizingMask key=\"autoresizingMask\" widthSizable=\"YES\" heightSizable=\"YES\"/>\n                          <color key=\"backgroundColor\" red=\"0.0\" green=\"0.0\" blue=\"0.0\" alpha=\"0.0\" colorSpace=\"custom\" customColorSpace=\"sRGB\"/>\n                          <viewLayoutGuide key=\"safeArea\" id=\"1Xd-am-t49\"/>\n                      </view>\n                  </viewController>\n                  <placeholder placeholderIdentifier=\"IBFirstResponder\" id=\"CEy-Cv-SGf\" userLabel=\"First Responder\" sceneMemberID=\"firstResponder\"/>\n              </objects>\n          </scene>\n      </scenes>\n  </document>\n  ";
}
exports.getShareExtensionStoryBoardContent = getShareExtensionStoryBoardContent;
//: [root]/ios/ShareExtension/ShareViewController.swift
function getShareExtensionViewControllerPath(platformProjectRoot) {
    return node_path_1.default.join(platformProjectRoot, constants_1.shareExtensionName, constants_1.shareExtensionViewControllerFileName);
}
exports.getShareExtensionViewControllerPath = getShareExtensionViewControllerPath;
function getShareExtensionViewControllerContent(scheme) {
    console.debug("************ scheme", scheme);
    return "import UIKit\nimport Social\nimport MobileCoreServices\n\nclass ShareViewController: UIViewController {\n    // IMPORTANT: This should be your host app scheme\n    let hostAppURLScheme = \"".concat(scheme, "\"\n    let urlContentType = kUTTypeURL as String\n    let textContentType = kUTTypePlainText as String\n    \n    override func viewDidLoad() {\n        \n        var strUrl:String? = nil\n        DispatchQueue.global().async {\n            \n            \n            if let content = self.extensionContext!.inputItems[0] as? NSExtensionItem {\n                if let contents = content.attachments {\n                    for (_, attachment) in (contents).enumerated() {\n                        if attachment.hasItemConformingToTypeIdentifier(self.urlContentType) {\n                            let _strUrl = self.getStrUrlFromUrl(attachment: attachment)\n                            if(_strUrl != nil){\n                                strUrl = _strUrl\n                            }\n                        }\n                        \n                        if attachment.hasItemConformingToTypeIdentifier(self.textContentType) {\n                            if(strUrl != nil){\n                                continue;\n                            }\n                            let    _strUrl = self.getStrUrlFromText(attachment: attachment)\n                            if(_strUrl != nil){\n                                strUrl = _strUrl\n                            }\n                            \n                        }\n                    }\n                }\n            }\n            \n            if(strUrl == nil){\n                self.dismissWithError()\n                return;\n            }\n            self.redirectToHostApp(sharedURL: strUrl!)\n        }\n    }\n    \n    \n    private func getStrUrlFromUrl ( attachment: NSItemProvider) -> String? {\n        var result:String? = nil\n        \n        let semaphore = DispatchSemaphore(value: 0)\n        \n        attachment.loadItem(forTypeIdentifier: self.urlContentType, options: nil) { data, error in\n            \n            if error == nil, let item = data as? URL {\n                let _url = URL(string: item.absoluteString)\n                if(_url != nil){\n                    result = item.absoluteString\n                }\n            }\n            semaphore.signal()\n        }\n        \n        semaphore.wait()\n        \n        return result\n    }\n    \n    private func getStrUrlFromText ( attachment: NSItemProvider) -> String? {\n        var result:String? = nil\n        \n        let semaphore = DispatchSemaphore(value: 0)\n        \n        attachment.loadItem(forTypeIdentifier: self.textContentType, options: nil) { data, error in\n            \n            if error == nil, let item = data as? String {\n                \n                let types: NSTextCheckingResult.CheckingType = [.link]\n                let detector = try? NSDataDetector(types: types.rawValue)\n                \n                if  detector != nil && item.count > 0 && detector!.numberOfMatches(in: item, options: NSRegularExpression.MatchingOptions(rawValue: 0), range: NSMakeRange(0, item.count)) > 0 {\n                    result = item\n                }\n                \n            }\n            semaphore.signal()\n        }\n        \n        semaphore.wait()\n        \n        \n        return result\n    }    \n    \n    private func dismissWithError() {\n        self.dismiss(animated: true, completion: nil)\n        extensionContext!.completeRequest(returningItems: [], completionHandler: nil)\n    }\n    \n    private func redirectToHostApp(sharedURL: String) {\n        var urlComponents = URLComponents()\n        urlComponents.scheme = hostAppURLScheme\n        urlComponents.host = \"share\"\n        urlComponents.path = \"/\"\n        urlComponents.queryItems = [\n            URLQueryItem(name: \"url\", value: sharedURL),\n        ]\n        // urlComponents.url: (scheme)://share/?url=(sharedURL)\n        let url = urlComponents.url\n        var responder = self as UIResponder?\n        let selectorOpenURL = sel_registerName(\"openURL:\")\n        \n        while (responder != nil) {\n            if (responder?.responds(to: selectorOpenURL))! {\n                responder?.perform(selectorOpenURL, with: url)\n            }\n            responder = responder!.next\n        }\n        extensionContext!.completeRequest(returningItems: [], completionHandler: nil)\n    }\n}\n");
}
exports.getShareExtensionViewControllerContent = getShareExtensionViewControllerContent;
//# sourceMappingURL=writeShareExtensionFiles.js.map