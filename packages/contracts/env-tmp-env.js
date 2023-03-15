const fs = require("fs");

const name = "mysome" + Math.round(Math.random() * 999999);

const content = `C_NAME=${name}
C_IDX=
`;

fs.writeFileSync(".env-tmp", content, {
  encoding: 'utf8',
  flag: 'w',
});
