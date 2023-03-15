const path = require('path');

module.exports = {
    webpack: (config, env) => {
        config.output.path = path.resolve(process.cwd(), 'build/popup');
        const pluginIndex = config.plugins.findIndex( x => !!x?.options?.typescript );
        // console.log(config.plugins[pluginIndex]);
        // console.log(config.plugins[pluginIndex].options.typescript);
        // console.log(config, env);
        config.plugins[pluginIndex].options.typescript.configFile = path.resolve(process.cwd(), 'tsconfig-popup.json');
        // process.exit(-1);    
        return config;
    },
    paths: (paths, env) => {
        paths.appTsConfig = path.resolve(process.cwd(), 'tsconfig-popup.json');
        paths.appBuild = path.resolve(process.cwd(), 'build/popup');
        paths.appPublic = path.resolve(__dirname, 'public-popup');
        paths.appHtml = path.resolve(process.cwd(), 'public-popup/index.html');
        paths.appSrc = path.resolve(__dirname, 'src-popup');
        paths.appIndexJs = path.resolve(__dirname, 'src-popup/index.tsx');
        // console.log(paths, env);
        // process.exit(-1);    
        return paths;
    }
};
