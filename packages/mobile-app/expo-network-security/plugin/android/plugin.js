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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidPlugin = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var config_plugins_1 = require("@expo/config-plugins");
// import { ManifestActivity } from '@expo/config-plugins/build/android/Manifest';
var codeNetworkSecurity = function () { return "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<network-security-config>\n  <domain-config>\n    <domain-config cleartextTrafficPermitted=\"true\">\n      <domain includeSubdomains=\"true\">127.0.0.1</domain>\n      <domain includeSubdomains=\"true\">10.0.0.1</domain>\n      <domain includeSubdomains=\"true\">10.0.1.1</domain>\n      <domain includeSubdomains=\"true\">10.0.2.2</domain>\n      <domain includeSubdomains=\"true\">localhost</domain>\n    </domain-config>\n    <domain includeSubdomains=\"true\">mysomeid.dev</domain>\n    <domain includeSubdomains=\"true\">mysome.id</domain>\n    <trust-anchors>\n      <certificates src=\"user\"/>\n      <certificates src=\"system\"/>\n    </trust-anchors>\n  </domain-config>\n</network-security-config>\n\n"; };
var withAndroidPlugin = function (config) {
    config = (0, config_plugins_1.withAndroidManifest)(config, function (config) {
        var _a, _b, _c, _d;
        var mainApplication = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
        var packageName = (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.package) !== null && _b !== void 0 ? _b : null;
        var platformProjectRoot = config.modRequest.platformProjectRoot;
        mainApplication.$ = __assign(__assign({}, ((_c = mainApplication === null || mainApplication === void 0 ? void 0 : mainApplication.$) !== null && _c !== void 0 ? _c : {})), { 'android:networkSecurityConfig': '@xml/network_security_config' });
        var dir = path_1.default.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
        try {
            fs_1.default.mkdirSync(dir, {});
        }
        catch (e) {
            if (((_d = e.message) === null || _d === void 0 ? void 0 : _d.indexOf('already exists')) === -1) {
                console.error(e);
                throw e;
            }
        }
        var fnNetworkSecCfgXml = path_1.default.join(dir, 'network_security_config.xml');
        console.log("Creating file : " + fnNetworkSecCfgXml);
        fs_1.default.writeFileSync(fnNetworkSecCfgXml, codeNetworkSecurity());
        return config;
    });
    return config;
};
exports.withAndroidPlugin = withAndroidPlugin;
//# sourceMappingURL=plugin.js.map