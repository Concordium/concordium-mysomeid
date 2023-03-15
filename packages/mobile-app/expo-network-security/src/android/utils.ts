
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
