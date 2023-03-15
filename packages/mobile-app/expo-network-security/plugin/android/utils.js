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
//# sourceMappingURL=utils.js.map