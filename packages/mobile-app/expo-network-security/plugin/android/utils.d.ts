declare function insertAfterText(contents: string, searchFor: string, insertAfter: string): string;
declare function cursorBefore(contents: string, args: {
    searchFor: RegExp;
    cursor: number;
}): {
    pos: number;
    text: string;
};
declare function cursorAfter(contents: string, args: {
    searchFor: RegExp;
    cursor: number;
}): {
    pos: number;
    text: string;
};
declare function insertText(contents: string, args: {
    text: string;
    cursor: number;
}): {
    pos: number;
    text: string;
};
//# sourceMappingURL=utils.d.ts.map