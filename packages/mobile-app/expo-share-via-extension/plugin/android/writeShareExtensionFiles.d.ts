export declare function writeShareExtensionFiles(platformProjectRoot: string, scheme: string, appIdentifier: string): Promise<void>;
export declare function getShareExtensionEntitlementsFilePath(platformProjectRoot: string): string;
export declare function getShareExtensionEntitlements(appIdentifier: string): {
    "com.apple.security.application-groups": any;
};
export declare function getShareExtensionEntitlementsContent(appIdentifier: string): string;
export declare function getShareExtensionInfoFilePath(platformProjectRoot: string): string;
export declare function getShareExtensionInfoContent(): string;
export declare function getShareExtensionStoryboardFilePath(platformProjectRoot: string): string;
export declare function getShareExtensionStoryBoardContent(): string;
export declare function getShareExtensionViewControllerPath(platformProjectRoot: string): string;
export declare function getShareExtensionViewControllerContent(scheme: string): string;
//# sourceMappingURL=writeShareExtensionFiles.d.ts.map