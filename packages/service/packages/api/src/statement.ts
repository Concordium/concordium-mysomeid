import { AttributesKeys, IdStatement, IdStatementBuilder, verifyIdstatement } from '@concordium/node-sdk';

let _stmt: IdStatement | undefined;

export function getStatement(): IdStatement {
  if ( _stmt ) {
    return _stmt;
  }
  const stmtBldr = new IdStatementBuilder();
  stmtBldr.revealAttribute(AttributesKeys.firstName);
  stmtBldr.revealAttribute(AttributesKeys.lastName);
  const s = stmtBldr.getStatement();
  try {
    verifyIdstatement(s);
  } catch(e) {
    console.error("Error creating statement", e);
    process.exit(-1);
  }
  _stmt = s;
  return _stmt;
}
