const postcss           = require('rollup-plugin-postcss');

const autoprefixer      = require('autoprefixer');
const postcssPresetEnv  = require('postcss-preset-env');

const s_CONFLICT_PACKAGES = ['rollup-plugin-postcss'];
const s_PACKAGE_NAME = '@typhonjs-node-rollup/plugin-postcss';

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
    * Returns the any modules that cause a conflict.
    *
    * @returns {string[]}
    */
   static get conflictPackages() { return s_CONFLICT_PACKAGES; }

   /**
    * Returns the `package.json` module name.
    *
    * @returns {string}
    */
   static get packageName() { return s_PACKAGE_NAME; }

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

      const result = await global.$$eventbus.triggerAsync('typhonjs:oclif:system:file:util:config:open', {
         moduleName: 'postcss',
         errorMessage: `${PluginLoader.packageName} loading local configuration file failed...`
      });

      if (result !== null)
      {
         if (typeof result.config === 'object')
         {
            if (Object.keys(result.config).length === 0)
            {
               global.$$eventbus.trigger('log:warn',
                `${PluginLoader.packageName}: local PostCSS configuration file empty using default configuration:\n`
               + `${result.relativePath}`);

               return s_DEFAULT_CONFIG;
            }

            global.$$eventbus.trigger('log:verbose',
             `${PluginLoader.packageName}: deferring to local PostCSS configuration file.`);

            return result.config;
         }
         else
         {
            global.$$eventbus.trigger('log:warn', `${PluginLoader.packageName}: local PostCSS configuration file `
            + `malformed using default; expected an 'object':\n${result.relativePath}`);

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