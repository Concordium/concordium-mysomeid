module.exports = {
  apps : [{
    name   : "Scraper",
    script : "./src/index.ts",
    watch: [
      './src'
    ],
    env: {
      "HEADLESS": "1",
      "EXEC_PATH_RESOLVE": "1",
    }
  }],
};
