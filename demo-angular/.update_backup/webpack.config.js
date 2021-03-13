const { join, relative, resolve, sep, dirname } = require("path");
const webpack = require("webpack");
const nsWebpack = require("nativescript-dev-webpack");
const nativescriptTarget = require("nativescript-dev-webpack/nativescript-target");
const { nsReplaceBootstrap } = require("nativescript-dev-webpack/transformers/ns-replace-bootstrap");
const { nsReplaceLazyLoader } = require("nativescript-dev-webpack/transformers/ns-replace-lazy-loader");
const { nsSupportHmrNg } = require("nativescript-dev-webpack/transformers/ns-support-hmr-ng");
const { getMainModulePath } = require("nativescript-dev-webpack/utils/ast-utils");
const { getNoEmitOnErrorFromTSConfig, getCompilerOptionsFromTSConfig } = require("nativescript-dev-webpack/utils/tsconfig-utils");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { NativeScriptWorkerPlugin } = require("nativescript-worker-loader/NativeScriptWorkerPlugin");
const TerserPlugin = require("terser-webpack-plugin");
const { getAngularCompilerPlugin } = require("nativescript-dev-webpack/plugins/NativeScriptAngularCompilerPlugin");
const hashSalt = Date.now().toString();
module.exports = env => {
  const appComponents = env.appComponents || [];
  appComponents.push(...[
    "tns-core-modules/ui/frame",
    "tns-core-modules/ui/frame/activity",
  ]);
  const platform = env && (env.android && "android" || env.ios && "ios" || env.platform);
  if (!platform) {
    throw new Error("You need to provide a target platform!");
  }
  const AngularCompilerPlugin = getAngularCompilerPlugin(platform);
  const projectRoot = __dirname;
  const dist = resolve(projectRoot, nsWebpack.getAppPath(platform, projectRoot));
  const {
    appPath = "src",
    appResourcesPath = "App_Resources",
    aot, 
    snapshot, 
    production, 
    uglify, 
    report, 
    sourceMap, 
    hiddenSourceMap, 
    hmr, 
    unitTesting, 
    verbose, 
    snapshotInDocker, 
    skipSnapshotTools, 
    compileSnapshot 
  } = env;
  const useLibs = compileSnapshot;
  const isAnySourceMapEnabled = !!sourceMap || !!hiddenSourceMap;
  const externals = nsWebpack.getConvertedExternals(env.externals);
  const appFullPath = resolve(projectRoot, appPath);
  const tsConfigName = "tsconfig.tns.json";
  const tsConfigPath = join(__dirname, tsConfigName);
  const hasRootLevelScopedModules = nsWebpack.hasRootLevelScopedModules({ projectDir: projectRoot });
  const hasRootLevelScopedAngular = nsWebpack.hasRootLevelScopedAngular({ projectDir: projectRoot });
  let coreModulesPackageName = "tns-core-modules";
  const alias = env.alias || {};
  alias['~'] = appFullPath;
  const compilerOptions = getCompilerOptionsFromTSConfig(tsConfigPath);
  if (hasRootLevelScopedModules) {
    coreModulesPackageName = "@nativescript/core";
    alias["tns-core-modules"] = coreModulesPackageName;
    nsWebpack.processTsPathsForScopedModules({ compilerOptions });
  }
  if (hasRootLevelScopedAngular) {
    alias["nativescript-angular"] = "@nativescript/angular";
    nsWebpack.processTsPathsForScopedAngular({ compilerOptions });
  }
  const appResourcesFullPath = resolve(projectRoot, appResourcesPath);
  const entryModule = `${nsWebpack.getEntryModule(appFullPath, platform)}.ts`;
  const entryPath = `.${sep}${entryModule}`;
  const entries = env.entries || {};
  entries.bundle = entryPath;
  const areCoreModulesExternal = Array.isArray(env.externals) && env.externals.some(e => e.indexOf("tns-core-modules") > -1);
  if (platform === "ios" && !areCoreModulesExternal) {
    entries["tns_modules/tns-core-modules/inspector_modules"] = "inspector_modules";
  };
  const ngCompilerTransformers = [];
  const additionalLazyModuleResources = [];
  if (aot) {
    ngCompilerTransformers.push(nsReplaceBootstrap);
  }
  if (hmr) {
    ngCompilerTransformers.push(nsSupportHmrNg);
  }
  if (env.externals && env.externals.indexOf("@angular/core") > -1) {
    const appModuleRelativePath = getMainModulePath(resolve(appFullPath, entryModule), tsConfigName);
    if (appModuleRelativePath) {
      const appModuleFolderPath = dirname(resolve(appFullPath, appModuleRelativePath));
      ngCompilerTransformers.push(nsReplaceLazyLoader);
      additionalLazyModuleResources.push(appModuleFolderPath);
    }
  }
  const ngCompilerPlugin = new AngularCompilerPlugin({
    hostReplacementPaths: nsWebpack.getResolver([platform, "tns"]),
    platformTransformers: ngCompilerTransformers.map(t => t(() => ngCompilerPlugin, resolve(appFullPath, entryModule), projectRoot)),
    mainPath: join(appFullPath, entryModule),
    tsConfigPath,
    skipCodeGeneration: !aot,
    sourceMap: !!isAnySourceMapEnabled,
    additionalLazyModuleResources: additionalLazyModuleResources,
    compilerOptions: { paths: compilerOptions.paths }
  });
  let sourceMapFilename = nsWebpack.getSourceMapFilename(hiddenSourceMap, __dirname, dist);
  const itemsToClean = [`${dist}*`];
  if (platform === "android") {
    itemsToClean.push(`${join(projectRoot, "platforms", "android", "app", "src", "main", "assets", "snapshots")}`);
    itemsToClean.push(`${join(projectRoot, "platforms", "android", "app", "build", "configurations", "nativescript-android-snapshot")}`);
  }
  const noEmitOnErrorFromTSConfig = getNoEmitOnErrorFromTSConfig(join(projectRoot, tsConfigName));
  nsWebpack.processAppComponents(appComponents, platform);
  const config = {
    mode: production ? "production" : "development",
    context: appFullPath,
    externals,
    watchOptions: {
      ignored: [
        appResourcesFullPath,
        "**/.*",
      ]
    },
    target: nativescriptTarget,
    entry: entries,
    output: {
      pathinfo: false,
      path: dist,
      sourceMapFilename,
      libraryTarget: "commonjs2",
      filename: "[name].js",
      globalObject: "global",
      hashSalt
    },
    resolve: {
      extensions: [".ts", ".js", ".scss", ".css"],
      modules: [
        resolve(__dirname, `node_modules/${coreModulesPackageName}`),
        resolve(__dirname, "node_modules"),
        `node_modules/${coreModulesPackageName}`,
        "node_modules",
      ],
      alias,
      symlinks: true
    },
    resolveLoader: {
      symlinks: false
    },
    node: {
      "http": false,
      "timers": false,
      "setImmediate": false,
      "fs": "empty",
      "__dirname": false,
    },
    devtool: hiddenSourceMap ? "hidden-source-map" : (sourceMap ? "inline-source-map" : "none"),
    optimization: {
      runtimeChunk: "single",
      noEmitOnErrors: noEmitOnErrorFromTSConfig,
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: "vendor",
            chunks: "all",
            test: (module, chunks) => {
              const moduleName = module.nameForCondition ? module.nameForCondition() : '';
              return /[\\/]node_modules[\\/]/.test(moduleName) ||
                appComponents.some(comp => comp === moduleName);
            },
            enforce: true,
          },
        }
      },
      minimize: !!uglify,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          cache: true,
          sourceMap: isAnySourceMapEnabled,
          terserOptions: {
            output: {
              comments: false,
              semicolons: !isAnySourceMapEnabled
            },
            compress: {
              'collapse_vars': platform !== "android",
              sequences: platform !== "android",
            }
          }
        })
      ],
    },
    module: {
      rules: [
        {
          include: join(appFullPath, entryPath),
          use: [
            platform === "android" && {
              loader: "nativescript-dev-webpack/android-app-components-loader",
              options: { modules: appComponents }
            },
            {
              loader: "nativescript-dev-webpack/bundle-config-loader",
              options: {
                angular: true,
                loadCss: !snapshot, 
                unitTesting,
                appFullPath,
                projectRoot,
                ignoredFiles: nsWebpack.getUserDefinedEntries(entries, platform)
              }
            },
          ].filter(loader => !!loader)
        },
        { test: /\.html$|\.xml$/, use: "raw-loader" },
        {
          test: /[\/|\\]app\.css$/,
          use: [
            "nativescript-dev-webpack/style-hot-loader",
            {
              loader: "nativescript-dev-webpack/css2json-loader",
              options: { useForImports: true }
            }
          ]
        },
        {
          test: /[\/|\\]app\.scss$/,
          use: [
            "nativescript-dev-webpack/style-hot-loader",
            {
              loader: "nativescript-dev-webpack/css2json-loader",
              options: { useForImports: true }
            },
            "sass-loader"
          ]
        },
        { test: /\.css$/, exclude: /[\/|\\]app\.css$/, use: "raw-loader" },
        { test: /\.scss$/, exclude: /[\/|\\]app\.scss$/, use: ["raw-loader", "resolve-url-loader", "sass-loader"] },
        {
          test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
          use: [
            "nativescript-dev-webpack/moduleid-compat-loader",
            "nativescript-dev-webpack/lazy-ngmodule-hot-loader",
            "@ngtools/webpack",
          ]
        },
        {
          test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
          parser: { system: true },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        "global.TNS_WEBPACK": "true",
        "process": "global.process",
      }),
      new CleanWebpackPlugin(itemsToClean, { verbose: !!verbose }),
      new CopyWebpackPlugin([
        { from: { glob: "fonts*.jpg" } },
        { from: { glob: "**/*.png" } },
      ], { ignore: [`${relative(appPath, appResourcesFullPath)}/**`] }),
      new nsWebpack.GenerateNativeScriptEntryPointsPlugin("bundle"),
      new NativeScriptWorkerPlugin(),
      ngCompilerPlugin,
      new nsWebpack.WatchStateLoggerPlugin(),
    ],
  };
  if (report) {
    config.plugins.push(new BundleAnalyzerPlugin({
      analyzerMode: "static",
      openAnalyzer: false,
      generateStatsFile: true,
      reportFilename: resolve(projectRoot, "report", `report.html`),
      statsFilename: resolve(projectRoot, "report", `stats.json`),
    }));
  }
  if (snapshot) {
    config.plugins.push(new nsWebpack.NativeScriptSnapshotPlugin({
      chunk: "vendor",
      angular: true,
      requireModules: [
        "reflect-metadata",
        "@angular/platform-browser",
        "@angular/core",
        "@angular/common",
        "@angular/router",
        "nativescript-angular/platform-static",
        "nativescript-angular/router",
      ],
      projectRoot,
      webpackConfig: config,
      snapshotInDocker,
      skipSnapshotTools,
      useLibs
    }));
  }
  if (hmr) {
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
  }
  return config;
};
