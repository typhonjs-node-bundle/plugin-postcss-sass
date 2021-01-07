const postcss           = require('rollup-plugin-postcss');

const autoprefixer      = require('autoprefixer');
const postcssPresetEnv  = require('postcss-preset-env');

const s_LOCAL_CONFIG_BASENAME = 'postcss.config';
const s_LOCAL_CONFIG_EXTENSIONS = ['.js', '.mjs'];

const s_DEFAULT_CONFIG = {
   inject: false,                                                       // Don't inject CSS into <HEAD>
   plugins: [autoprefixer, postcssPresetEnv],                           // Postcss plugins to use
   extensions: ['.css', '.less', '.sass', '.scss', '.styl', '.stylus'], // File extensions
   use: ['sass', 'stylus', 'less'],                                     // Use sass / dart-sass
};

/**
 * Handles interfacing with the plugin manager adding event bindings to pass back a configured
 * instance of `rollup-plugin-postcss` with autoprefixer, postcss, postcss-preset-env.
 */
class PluginLoader
{
   /**
    * Returns the `package.json` module name.
    *
    * @returns {string}
    */
   static get pluginName() { return '@typhonjs-node-rollup/plugin-postcss'; }

   /**
    * Returns the rollup plugins managed.
    *
    * @returns {string[]}
    */
   static get rollupPlugins() { return ['rollup-plugin-postcss']; }

   /**
    * Returns the configured input plugin for `@rollup/plugin-replace`
    *
    * @param {object} bundleData - The CLI config
    * @param {object} bundleData.cliFlags  - The CLI flags
    *
    * @returns {object} Rollup plugin
    */
   static async getInputPlugin(bundleData = {})
   {
      if (bundleData.cliFlags)
      {
         const minimize = typeof bundleData.cliFlags.compress === 'boolean' ? bundleData.cliFlags.compress : false;

         const sourceMap = typeof bundleData.cliFlags.sourcemap === 'boolean' ? bundleData.cliFlags.sourcemap : true;

         const filename = typeof bundleData.currentBundle.outputCSSFilename === 'string' ?
          bundleData.currentBundle.outputCSSFilename : 'styles.css';

         const config = await PluginLoader._loadConfig(bundleData.cliFlags);

         config.extract = filename;    // Output CSS w/ bundle file name to the deploy directory
         config.minimize = minimize;   // Potentially minimizes
         config.sourceMap = sourceMap; // Potentially generate sourcemaps

         return postcss(config);
      }
   }

   /**
    * Attempt to load a local configuration file or provide the default configuration.
    *
    * @param {object} cliFlags - The CLI flags.
    *
    * @returns {object} Either the default PostCSS configuration file or a locally provided configuration file.
    * @private
    */
   static async _loadConfig(cliFlags)
   {
      if (typeof cliFlags['ignore-local-config'] === 'boolean' && cliFlags['ignore-local-config'])
      {
         return s_DEFAULT_CONFIG;
      }

      // Attempt to load any local configuration files via FileUtil.

      const localConfig = await global.$$eventbus.triggerSync('typhonjs:oclif:system:file:util:configs:local:open',
       s_LOCAL_CONFIG_BASENAME, s_LOCAL_CONFIG_EXTENSIONS,
        `${PluginLoader.pluginName} loading local configuration file failed...`);

      if (localConfig !== null)
      {
         if (typeof localConfig.data === 'object')
         {
            if (Object.keys(localConfig.data).length === 0)
            {
               global.$$eventbus.trigger('log:warn',
                `${PluginLoader.pluginName}: local PostCSS configuration file empty using default configuration:\n`
               + `${localConfig.relativePath}`);

               return s_DEFAULT_CONFIG;
            }

            global.$$eventbus.trigger('log:verbose',
             `${PluginLoader.pluginName}: deferring to local PostCSS configuration file.`);

            return localConfig.data;
         }
         else
         {
            global.$$eventbus.trigger('log:warn', `${PluginLoader.pluginName}: local PostCSS configuration file `
            + `malformed using default; expected an 'object':\n${localConfig.relativePath}`);

            return s_DEFAULT_CONFIG;
         }
      }

      return s_DEFAULT_CONFIG;
   }

   /**
    * Wires up PluginHandler on the plugin eventbus.
    *
    * @param {PluginEvent} ev - The plugin event.
    *
    * @see https://www.npmjs.com/package/typhonjs-plugin-manager
    *
    * @ignore
    */
   static onPluginLoad(ev)
   {
      ev.eventbus.on('typhonjs:oclif:bundle:plugins:main:input:get', PluginLoader.getInputPlugin, PluginLoader);
   }
}

module.exports = PluginLoader;