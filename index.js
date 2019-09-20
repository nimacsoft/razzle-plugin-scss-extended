const autoprefixer = require("autoprefixer");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const PostCssFlexBugFixes = require("postcss-flexbugs-fixes");
const paths = require("razzle/config/paths");
const PurgecssPlugin = require("purgecss-webpack-plugin");
const cssnano = require("cssnano");
const pxtorem = require("postcss-pxtorem");
const glob = require("glob");

const defaultOptions = {
  postcss: {
    dev: {
      sourceMap: true,
      ident: "postcss"
    },
    prod: {
      sourceMap: false,
      ident: "postcss"
    },
    defaulPlugins: [
      PostCssFlexBugFixes,
      autoprefixer({
        browsers: [">1%", "last 4 versions", "Firefox ESR", "not ie < 11"],
        flexbox: "no-2009"
      }),
      pxtorem({
        replace: false
      }),
      cssnano({
        preset: "default"
      })
    ],
    plugins: []
  },
  sass: {
    dev: {
      sourceMap: true,
      includePaths: [paths.appNodeModules]
    },
    prod: {
      // XXX Source maps are required for the resolve-url-loader to properly
      // function. Disable them in later stages if you do not want source maps.
      sourceMap: true,
      sourceMapContents: false,
      includePaths: [paths.appNodeModules]
    }
  },
  css: {
    dev: {
      sourceMap: true,
      importLoaders: 1,
      modules: false,
      onlyLocals: false
    },
    prod: {
      sourceMap: false,
      importLoaders: 1,
      modules: false,
      onlyLocals: false
    }
  },
  style: {},
  resolveUrl: {
    dev: {},
    prod: {}
  },
  sassResources: {
    resources: ""
  },
  purgecssPlugin: {
    paths: glob.sync(paths.appSrc + "/**/*", { nodir: true }),
    whitelistPatterns: []
  }
};

module.exports = (
  defaultConfig,
  { target, dev },
  webpack,
  userOptions = {}
) => {
  const isServer = target !== "web";
  const constantEnv = dev ? "dev" : "prod";

  const config = Object.assign({}, defaultConfig);

  const options = Object.assign({}, defaultOptions, userOptions);

  const styleLoader = {
    loader: require.resolve("style-loader"),
    options: options.style
  };

  const cssLoader = {
    loader: require.resolve("css-loader"),
    options: isServer ? Object.assign({}, options.css[constantEnv], { onlyLocals: true }) : options.css[constantEnv]
  };

  const resolveUrlLoader = {
    loader: require.resolve("resolve-url-loader"),
    options: options.resolveUrl[constantEnv]
  };

  const postCssLoader = {
    loader: require.resolve("postcss-loader"),
    options: Object.assign({}, options.postcss[constantEnv], {
      plugins: () =>
        options.postcss.defaulPlugins.concat(options.postcss.plugins)
    })
  };

  const sassLoader = {
    loader: require.resolve("sass-loader"),
    options: options.sass[constantEnv]
  };

  const sassResourcesLoader = {
    loader: require.resolve("sass-resources-loader"),
    options: options.sassResources
  };

  config.plugins.push(new PurgecssPlugin(options.purgecssPlugin));

  const loaders = isServer
    ? [
        cssLoader,
        resolveUrlLoader,
        postCssLoader,
        sassLoader
      ]
    : [
        dev ? styleLoader : MiniCssExtractPlugin.loader,
        cssLoader,
        postCssLoader,
        resolveUrlLoader,
        sassLoader
      ];

  if (options.sassResources.resources !== "") {
    loaders.push(sassResourcesLoader);
  }

  config.module.rules = [
    ...config.module.rules,
    {
      test: /\.(sa|sc)ss$/,
      use: loaders,
      sideEffects: true,
    }
  ];

  return config;
};
