"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidPlugin = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var config_plugins_1 = require("@expo/config-plugins");
// // package com.krismort.asdasd.share;
var codeMessagesModule = function (packageLine) { return "".concat(packageLine, "\n\nimport androidx.annotation.NonNull;\nimport com.facebook.react.bridge.Arguments;\nimport com.facebook.react.bridge.ReactApplicationContext;\nimport com.facebook.react.bridge.ReactContextBaseJavaModule;\nimport com.facebook.react.bridge.ReactMethod;\nimport com.facebook.react.modules.core.DeviceEventManagerModule;\nimport com.facebook.react.bridge.WritableMap;\n\nimport java.util.LinkedList;\nimport java.util.Queue;\nimport java.util.Timer;\nimport java.util.TimerTask;\n\npublic class MessagesModule extends ReactContextBaseJavaModule {\n    static MessagesModule instance;\n\n    public interface GetInstanceCallback {\n        void onInstance(MessagesModule inst);\n    }\n\n    static void getInstance(GetInstanceCallback cb) {\n        Timer timer = new Timer();\n        TimerTask timerTask = new TimerTask() {\n            @Override\n            public void run() {\n                if ( MessagesModule.instance == null ) {\n                    // Wait until the messages module is initialised.\n                    return;\n                }\n                timer.cancel();\n                cb.onInstance(MessagesModule.instance);\n            }\n        };\n        timer.schedule(timerTask, 0, 10);\n    }\n\n    static void handleIntent(String action, String type, String extraText) {\n      MessagesModule.getInstance( new MessagesModule.GetInstanceCallback() {\n        @Override\n        public void onInstance(MessagesModule inst) {\n          WritableMap params = Arguments.createMap();\n          params.putString(\"action\", action);\n          params.putString(\"type\", type);\n          params.putString(\"extra_text\", extraText);\n          MessagesModule.instance.sendMessage(\"intent\", params);\n        }\n      });\n    }\n\n    private ReactApplicationContext reactContext;\n\n    private boolean ready = false;\n\n    private class MessagesObject {\n        public String typeName;\n        public WritableMap params;\n\n        public MessagesObject(String typeName, WritableMap params) {\n            this.typeName = typeName;\n            this.params = params;\n        }\n    }\n\n    private Queue<MessagesObject> messageQueue = new LinkedList<MessagesObject>();\n\n    public MessagesModule(ReactApplicationContext reactContext) {\n        super(reactContext);\n        this.reactContext = reactContext;\n        MessagesModule.instance = this;\n    }\n\n    public void sendMessage(String type, WritableMap params ) {\n        if ( !this.ready ) {\n            messageQueue.add(new MessagesObject(type, params));\n            return;\n        }\n        this.reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)\n            .emit(type, params);\n    }\n\n    @NonNull\n    @Override\n    public String getName() {\n        return \"MessagesModule\";\n    }\n\n    @ReactMethod\n    public void setReady() {\n        if ( !this.ready ) {\n            for (MessagesObject messagesObject : this.messageQueue) {\n                this.reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)\n                        .emit(messagesObject.typeName, messagesObject.params);\n            }\n            this.messageQueue.clear();\n        }\n        this.ready = true;\n    }\n\n    @ReactMethod\n    public void setNotReady() {\n        this.ready = true;\n    }\n}\n"); };
var codeMessagesPackage = function (packageLine) { return "".concat(packageLine, "\n\nimport com.facebook.react.ReactPackage;\nimport com.facebook.react.bridge.NativeModule;\nimport com.facebook.react.bridge.ReactApplicationContext;\nimport com.facebook.react.uimanager.ViewManager;\n\nimport java.util.ArrayList;\nimport java.util.Collections;\nimport java.util.List;\n\npublic class MessagesPackage implements ReactPackage {\n  @Override\n  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {\n    List<NativeModule> modules = new ArrayList<>();\n    modules.add(new MessagesModule(reactContext));\n    return modules;\n  }\n\n  @Override\n  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {\n    return Collections.emptyList();\n  }\n}\n"); };
function insertAfterText(contents, searchFor, insertAfter) {
    var indexFound = contents.indexOf(searchFor);
    if (indexFound === -1) {
        throw new Error('Import not found');
    }
    var index = indexFound + searchFor.length;
    contents = contents.substring(0, index) + insertAfter + contents.substring(index);
    return contents;
}
function cursorBefore(contents, args) {
    var _a;
    var searchFor = args.searchFor, cursor = args.cursor;
    if (cursor > contents.length) {
        throw new Error('Invalid offset');
    }
    var tmp = (_a = contents.substring(cursor)) !== null && _a !== void 0 ? _a : '';
    var idx = tmp.search(searchFor);
    var m = tmp.match(searchFor);
    if (!m || idx === -1) {
        console.log("searching in text : " + tmp);
        throw new Error('Not found : ->' + searchFor + '<-');
    }
    var pos = cursor + idx;
    return {
        pos: pos,
        text: contents,
    };
}
function cursorAfter(contents, args) {
    var _a;
    var searchFor = args.searchFor, cursor = args.cursor;
    if (cursor > contents.length) {
        throw new Error('Invalid offset');
    }
    var tmp = (_a = contents.substring(cursor)) !== null && _a !== void 0 ? _a : '';
    var idx = tmp.search(searchFor);
    var m = tmp.match(searchFor);
    if (!m || idx === -1) {
        throw new Error('Not found');
    }
    var pos = cursor + idx + m[0].length;
    return {
        pos: pos,
        text: contents,
    };
}
function insertText(contents, args) {
    var text = args.text, cursor = args.cursor;
    if (cursor > contents.length) {
        throw new Error('Invalid offset');
    }
    if (!text) {
        return {
            pos: cursor,
            text: text,
        };
    }
    return {
        pos: cursor + text.length,
        text: contents.substring(0, cursor) + text + contents.substring(cursor),
    };
}
var withAndroidPlugin = function (config) {
    config = (0, config_plugins_1.withAndroidManifest)(config, function (config) {
        var _a, _b, _c;
        var mainApplication = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
        var activity = (_b = (_a = mainApplication === null || mainApplication === void 0 ? void 0 : mainApplication.activity) === null || _a === void 0 ? void 0 : _a.find(function (x) { return x.$['android:name'] === '.MainActivity'; })) !== null && _b !== void 0 ? _b : null;
        if (!activity) {
            throw new Error('Failed to find Main activity');
        }
        // Add intent filter;
        /*<intent-filter>
            <action android:name="android.intent.action.SEND" />
            <category android:name="android.intent.category.DEFAULT" />
            <data android:mimeType="text/uri-list" />
            <data android:mimeType="text/x-uri" />
            <data android:mimeType="text/plain"/>
          </intent-filter>*/
        activity['intent-filter'] = __spreadArray([
            {
                action: [{ $: { 'android:name': "android.intent.action.SEND" } }],
                category: [{ $: { 'android:name': "android.intent.category.DEFAULT" } }],
                data: [
                    { $: { 'android:mimeType': "text/plain" } },
                    { $: { 'android:mimeType': "text/x-uri" } },
                    { $: { 'android:mimeType': "text/uri-list" } },
                ],
            }
        ], ((_c = activity['intent-filter']) !== null && _c !== void 0 ? _c : []), true);
        return config;
    });
    // Write files
    config = (0, config_plugins_1.withMainActivity)(config, function (config) {
        var _a, _b, _c;
        var platformProjectRoot = config.modRequest.platformProjectRoot;
        var packageName = (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.package) !== null && _b !== void 0 ? _b : null;
        if (!packageName) {
            throw new Error('No package name availble for Android project.');
        }
        // packageName = packageName ?? 'package com.krismort.asdasd;';
        console.log(config.modRequest);
        console.log("Project root", platformProjectRoot);
        var dir = path_1.default.join.apply(path_1.default, __spreadArray([platformProjectRoot, 'app', 'src', 'main', 'java'], packageName.split('.'), false));
        console.log("Files dir " + dir);
        try {
            fs_1.default.mkdirSync(dir, {});
        }
        catch (e) {
            if (((_c = e.message) === null || _c === void 0 ? void 0 : _c.indexOf('already exists')) === -1) {
                console.error(e);
            }
        }
        var packageLine = "package ".concat(packageName, ";");
        var fnMessagesModule = path_1.default.join(dir, 'MessagesModule.java');
        console.log("Creating file : " + fnMessagesModule);
        fs_1.default.writeFileSync(fnMessagesModule, codeMessagesModule(packageLine));
        var fnMessagesPackage = path_1.default.join(dir, 'MessagesPackage.java');
        console.log("Creating file : " + fnMessagesPackage);
        fs_1.default.writeFileSync(fnMessagesPackage, codeMessagesPackage(packageLine));
        var contents = config.modResults.contents;
        if (contents.indexOf('MessagesModule') === -1) {
            var cursor = {
                pos: 0,
                text: contents,
            };
            if (contents.indexOf('onNewIntent') >= 0) {
                throw new Error('onNewIntent already present');
            }
            if (cursor.text.indexOf('import expo.modules.BuildConfig;') === -1) {
                cursor = cursorAfter(cursor.text, { searchFor: /import expo.modules.ReactActivityDelegateWrapper;/gmi, cursor: cursor.pos });
                cursor = insertText(cursor.text, { text: "\nimport expo.modules.BuildConfig;", cursor: cursor.pos });
            }
            cursor = cursorBefore(cursor.text, { searchFor: /super.onCreate\(null\);/gmi, cursor: cursor.pos });
            cursor = insertText(cursor.text, { text: "\n\n    /* MessagesModule */\n    android.content.Intent intent = getIntent(); \n    String action = intent.getAction();\n    String type = intent.getType();\n    String extraText = intent.getStringExtra(android.content.Intent.EXTRA_TEXT);\n    MessagesModule.handleIntent(action, type, extraText);\n\n    ", cursor: cursor.pos });
            cursor = cursorAfter(cursor.text, { searchFor: /super.onCreate\(null\);/gmi, cursor: cursor.pos });
            cursor = cursorAfter(cursor.text, { searchFor: /\}/gmi, cursor: cursor.pos });
            cursor = cursorAfter(cursor.text, { searchFor: /\n|\r\n/gmi, cursor: cursor.pos });
            cursor = insertText(cursor.text, { cursor: cursor.pos, text: "\n\n  /* MessagesModule */\n  @Override\n  public void onNewIntent(android.content.Intent intent) {\n    super.onNewIntent(intent);\n    String action = intent.getAction();\n    String type = intent.getType();\n    String extraText = intent.getStringExtra(android.content.Intent.EXTRA_TEXT);\n    MessagesModule.handleIntent(action, type, extraText);\n  }\n" });
            config.modResults.contents = cursor.text;
        }
        return config;
    });
    config = (0, config_plugins_1.withMainApplication)(config, function (config) {
        var contents = config.modResults.contents;
        /*const toAdd = 'import com.alinz.parkerdan.shareextension.SharePackage;';
        contents = contents.indexOf(toAdd) === -1 ? insertAfterText(
          contents,
          'import java.util.List;',
          `\n\n${toAdd}\n`
        ) : contents;*/
        var pckLine = '\t\t\t\tpackages.add(new MessagesPackage());';
        contents = contents.indexOf(pckLine) === -1 ? insertAfterText(contents, "List<ReactPackage> packages = new PackageList(this).getPackages();", "\n".concat(pckLine, "\n")) : contents;
        config.modResults.contents = contents;
        return config;
    });
    return config;
};
exports.withAndroidPlugin = withAndroidPlugin;
//# sourceMappingURL=plugin.js.map