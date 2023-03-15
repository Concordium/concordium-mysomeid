const fs = require("fs");

process.stdin.setEncoding('utf8');

let a = fs.readFileSync("./init.log", {encoding: 'utf8'});

const strSuccess = "initialized with";
const i = a.indexOf(strSuccess);
if ( i == -1 ) {
  console.error("no success string in log.");
  process.exit(-1);
  return;
}

const off = i;
const jsonData = a.substr(a.indexOf("{", off), a.indexOf("}", off) - a.indexOf("{", off) + 1);
const obj = JSON.parse(jsonData);
if ( !obj?.index ) {
  console.log("Sorry no index...");
  process.exit(-1);
  return;
}
console.log("SUCCESS ", obj);

const str = fs.readFileSync(".env",{
  encoding: 'utf8'
}); 

let idx = obj.index;
const lines = str.split("\n");
lines[1] = "C_IDX=" + obj.index;
const newData = lines.join("\n");
fs.writeFileSync(".env", newData, {
  encoding: 'utf8',
});

console.log("Succesfully initialised and updated .env with index and name");  
process.exit(0);
