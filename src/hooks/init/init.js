const postcss           = require('rollup-plugin-postcss');

const autoprefixer      = require('autoprefixer');
const postcssPresetEnv  = require('postcss-preset-env');


/**
 * Handles interfacing with the plugin manager adding event bindings to pass back a configured
 * instance of `rollup-plugin-postcss` with autoprefixer, postcss, postcss-preset-env.
 */
class PluginHandler
{
   /**
    * Returns the configured input plugin for `@rollup/plugin-replace`
    *
    * @param {object} bundleData - The CLI config
    * @param {object} bundleData.cliFlags  - The CLI flags
    *
    * @returns {object} Rollup plugin
    */
   static getInputPlugin(bundleData = {})
   {
      if (bundleData.cliFlags)
      {
         const minimize = typeof bundleData.cliFlags.compress === 'boolean' ? bundleData.cliFlags.compress : false;

         const sourceMap = typeof bundleData.cliFlags.sourcemap === 'boolean' ? bundleData.cliFlags.sourcemap : true;

         const filename = typeof bundleData.currentBundle.cssFilename === 'string' ?
          bundleData.currentBundle.cssFilename : 'styles.css';

         const defaultConfig = {
            extract: filename,                           // Output CSS w/ bundle file name to the deploy directory
            inject: false,                               // Don't inject CSS into <HEAD>
            minimize,                                    // Potentially minimizes
            plugins: [autoprefixer, postcssPresetEnv],   // Postcss plugins to use
            sourceMap,                                   // Potentially generate sourcemaps
         };

         const postcssConfig = {
            extensions: ['.scss', '.sass', '.css'],      // File extensions
            use: ['sass'],                               // Use sass / dart-sass
         };

         return postcss(Object.assign(defaultConfig, postcssConfig));
      }
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
      ev.eventbus.on('typhonjs:oclif:bundle:plugins:main:input:get', PluginHandler.getInputPlugin, PluginHandler);
   }
}

/**
 * Oclif init hook to add PluginHandler to plugin manager.
 *
 * @param {object} opts - options of the CLI action.
 *
 * @returns {Promise<void>}
 */
module.exports = async function(opts)
{
   try
   {
      global.$$pluginManager.add({ name: '@typhonjs-node-bundle/plugin-postcss-sass', instance: PluginHandler });

      // TODO REMOVE
      process.stdout.write(`plugin-postcss-sass init hook running ${opts.id}\n`);
   }
   catch (error)
   {
      this.error(error);
   }
};
