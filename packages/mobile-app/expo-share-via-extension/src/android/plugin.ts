import fs from 'fs';
import path from 'path';
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  // withProjectBuildGradle,
  withMainActivity,
  withMainApplication,
} from "@expo/config-plugins";
import { ManifestActivity } from '@expo/config-plugins/build/android/Manifest';

// // package com.krismort.asdasd.share;
const codeMessagesModule = (packageLine: string) => `${packageLine}\n
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;\n
import java.util.LinkedList;
import java.util.Queue;
import java.util.Timer;
import java.util.TimerTask;\n
public class MessagesModule extends ReactContextBaseJavaModule {
    static MessagesModule instance;\n
    public interface GetInstanceCallback {
        void onInstance(MessagesModule inst);
    }\n
    static void getInstance(GetInstanceCallback cb) {
        Timer timer = new Timer();
        TimerTask timerTask = new TimerTask() {
            @Override
            public void run() {
                if ( MessagesModule.instance == null ) {
                    // Wait until the messages module is initialised.
                    return;
                }
                timer.cancel();
                cb.onInstance(MessagesModule.instance);
            }
        };
        timer.schedule(timerTask, 0, 10);
    }\n
    static void handleIntent(String action, String type, String extraText) {
      MessagesModule.getInstance( new MessagesModule.GetInstanceCallback() {
        @Override
        public void onInstance(MessagesModule inst) {
          WritableMap params = Arguments.createMap();
          params.putString("action", action);
          params.putString("type", type);
          params.putString("extra_text", extraText);
          MessagesModule.instance.sendMessage("intent", params);
        }
      });
    }\n
    private ReactApplicationContext reactContext;\n
    private boolean ready = false;\n
    private class MessagesObject {
        public String typeName;
        public WritableMap params;\n
        public MessagesObject(String typeName, WritableMap params) {
            this.typeName = typeName;
            this.params = params;
        }
    }\n
    private Queue<MessagesObject> messageQueue = new LinkedList<MessagesObject>();\n
    public MessagesModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        MessagesModule.instance = this;
    }\n
    public void sendMessage(String type, WritableMap params ) {
        if ( !this.ready ) {
            messageQueue.add(new MessagesObject(type, params));
            return;
        }
        this.reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(type, params);
    }\n
    @NonNull
    @Override
    public String getName() {
        return "MessagesModule";
    }\n
    @ReactMethod
    public void setReady() {
        if ( !this.ready ) {
            for (MessagesObject messagesObject : this.messageQueue) {
                this.reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(messagesObject.typeName, messagesObject.params);
            }
            this.messageQueue.clear();
        }
        this.ready = true;
    }\n
    @ReactMethod
    public void setNotReady() {
        this.ready = true;
    }
}\n`;

const codeMessagesPackage = (packageLine: string) => `${packageLine}\n
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;\n
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;\n
public class MessagesPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new MessagesModule(reactContext));
    return modules;
  }\n
  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}\n`;

function insertAfterText(contents: string, searchFor: string, insertAfter: string): string {
  const indexFound = contents.indexOf(searchFor);
  if ( indexFound === -1 ) {
    throw new Error('Import not found');
  }
  const index = indexFound + searchFor.length;
  contents = contents.substring(0, index) + insertAfter + contents.substring(index);
  return contents;
}

function cursorBefore(contents: string, args: {searchFor: RegExp, cursor: number}): {pos: number, text: string} {
  const {searchFor, cursor} = args;
  if ( cursor > contents.length ) {
    throw new Error('Invalid offset');
  }

  const tmp = contents.substring(cursor) ?? '';
  const idx = tmp.search(searchFor);
  const m = tmp.match(searchFor);

  if ( !m || idx === -1 ) {
    console.log("searching in text : " + tmp);
    throw new Error('Not found : ->' + searchFor + '<-');
  }

  const pos = cursor + idx;

  return {
    pos,
    text: contents,
  };
}

function cursorAfter(contents: string, args: {searchFor: RegExp, cursor: number}): {pos: number, text: string} {
  const {searchFor, cursor} = args;
  if ( cursor > contents.length ) {
    throw new Error('Invalid offset');
  }

  const tmp = contents.substring(cursor) ?? '';
  const idx = tmp.search(searchFor);
  const m = tmp.match(searchFor);

  if ( !m || idx === -1 ) {
    throw new Error('Not found');
  }

  const pos = cursor + idx + m[0].length;

  return {
    pos,
    text: contents,
  };
}

function insertText(contents: string, args: {text: string, cursor: number}): {pos: number, text: string} {
  const {text, cursor} = args;
  if ( cursor > contents.length ) {
    throw new Error('Invalid offset');
  }

  if ( !text ) {
    return {
      pos: cursor,
      text,
    };
  }

  return {
    pos: cursor + text.length,
    text: contents.substring(0, cursor) + text + contents.substring(cursor),
  };
}

export const withAndroidPlugin: ConfigPlugin = (config) => {
  config = withAndroidManifest(config, config => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    const activity: ManifestActivity | null = mainApplication?.activity?.find(x => x.$['android:name'] === '.MainActivity') ?? null;

    if ( !activity ) {
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
    activity['intent-filter'] = [
      {
        action: [{$: {'android:name': "android.intent.action.SEND"}}],
        category: [{$: {'android:name': "android.intent.category.DEFAULT"}}],
        data: [
          {$: {'android:mimeType': "text/plain"}},
          {$: {'android:mimeType': "text/x-uri"}},
          {$: {'android:mimeType': "text/uri-list"}},
        ],
      },
      ...(activity['intent-filter'] ?? []),
    ];

    return config;
  });

  // Write files
  config = withMainActivity(config, config => {
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    let packageName: string | null = config.android?.package ?? null;
    if ( !packageName ) {
      throw new Error('No package name availble for Android project.');
    }
    // packageName = packageName ?? 'package com.krismort.asdasd;';

    console.log(config.modRequest);

    console.log("Project root", platformProjectRoot);
    const dir = path.join(platformProjectRoot, 'app', 'src', 'main', 'java', ...packageName.split('.'));
    console.log("Files dir " + dir);

    try {
      fs.mkdirSync(dir, {});
    } catch(e) {
      if (e.message?.indexOf('already exists') === -1 ) {
        console.error(e);
      }
    }

    const packageLine = `package ${packageName};`;

    const fnMessagesModule = path.join(dir, 'MessagesModule.java');
    console.log("Creating file : " + fnMessagesModule);
    fs.writeFileSync(fnMessagesModule, codeMessagesModule(packageLine));

    const fnMessagesPackage = path.join(dir, 'MessagesPackage.java');
    console.log("Creating file : " + fnMessagesPackage);
    fs.writeFileSync(fnMessagesPackage, codeMessagesPackage(packageLine));

    let contents = config.modResults.contents;

    
      
    if ( contents.indexOf('MessagesModule') === -1 ) {    
      let cursor = {
        pos: 0,
        text: contents,
      };

      if (contents.indexOf('onNewIntent') >= 0 ) {
        throw new Error('onNewIntent already present');
      }
      
      if ( cursor.text.indexOf('import expo.modules.BuildConfig;') === -1 ) {
        cursor = cursorAfter(cursor.text, {searchFor: /import expo.modules.ReactActivityDelegateWrapper;/gmi, cursor: cursor.pos});
        cursor = insertText(cursor.text, {text: `\nimport expo.modules.BuildConfig;`, cursor: cursor.pos});
      }

      cursor = cursorBefore(cursor.text, {searchFor: /super.onCreate\(null\);/gmi, cursor: cursor.pos});
      cursor = insertText(cursor.text, {text: `\n
    /* MessagesModule */
    android.content.Intent intent = getIntent(); 
    String action = intent.getAction();
    String type = intent.getType();
    String extraText = intent.getStringExtra(android.content.Intent.EXTRA_TEXT);
    MessagesModule.handleIntent(action, type, extraText);\n\n    `, cursor: cursor.pos});
      cursor = cursorAfter(cursor.text, {searchFor: /super.onCreate\(null\);/gmi, cursor: cursor.pos});
      cursor = cursorAfter(cursor.text, {searchFor: /\}/gmi, cursor: cursor.pos});
      cursor = cursorAfter(cursor.text, {searchFor: /\n|\r\n/gmi, cursor: cursor.pos});
      cursor = insertText(cursor.text, {cursor: cursor.pos, text: `\n
  /* MessagesModule */
  @Override
  public void onNewIntent(android.content.Intent intent) {
    super.onNewIntent(intent);
    String action = intent.getAction();
    String type = intent.getType();
    String extraText = intent.getStringExtra(android.content.Intent.EXTRA_TEXT);
    MessagesModule.handleIntent(action, type, extraText);
  }
`});
      config.modResults.contents = cursor.text;
    }
  
    return config;
  });

  config = withMainApplication(config, config => {
    let contents = config.modResults.contents;

    /*const toAdd = 'import com.alinz.parkerdan.shareextension.SharePackage;';
    contents = contents.indexOf(toAdd) === -1 ? insertAfterText(
      contents,
      'import java.util.List;',
      `\n\n${toAdd}\n`
    ) : contents;*/

    const pckLine = '\t\t\t\tpackages.add(new MessagesPackage());';
    contents = contents.indexOf(pckLine) === -1 ? insertAfterText(
      contents,
      `List<ReactPackage> packages = new PackageList(this).getPackages();`,
      `\n${pckLine}\n`
    ) : contents;

    config.modResults.contents = contents;
    return config;
  });

  return config;
};
