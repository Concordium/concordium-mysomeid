
const fs = require("fs");

// The C_NAME is stored in the env-tmp file.
const C_NAME = fs.readFileSync(".env-tmp", {
  encoding: 'utf8'
}).split("\n")[0].split("=")[1];

const buffer = fs.readFileSync("./deploy.log", {encoding: 'utf8'});

if ( buffer.indexOf("status \"success\"") === -1 ) {
  console.log("Failed to deployand will not update the .env file - cannot find success stirng  in buffered output.");
  return;
}

if ( !C_NAME ) {
  console.log("failed to store C_NAME into .env var");
  return;
}

const newData =`C_NAME=${C_NAME}
C_IDX=
`;
fs.writeFileSync(".env", newData, {
  encoding: 'utf8',
});

console.log("created new .env file");
