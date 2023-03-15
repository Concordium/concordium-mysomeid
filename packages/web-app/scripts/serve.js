const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 9000;
const buildDir = path.join(process.cwd(), 'build');
const index = path.join(process.cwd(), 'build', 'index.html');

app.use(express.static(buildDir));

app.get('/*', function (req, res) {
  res.sendFile(index);
});

app.listen(port);

console.log("Listening on port " + port + " - root diretory = " + buildDir );