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
    * @param {object} config        - The CLI config
    * @param {object} config.flags  - The CLI config
    *
    * @returns {object} Rollup plugin
    */
   static getInputPlugin(config = {})
   {
      if (config.flags)
      {
         const sourceMap = typeof config.flags.sourcemap === 'boolean' ? config.flags.sourcemap : true;

         const postcssConfig = {
            inject: false,                               // Don't inject CSS into <HEAD>
            extract: `styles.css`,                       // Output to `styles.css` in directory of the bundle
            extensions: ['.scss', '.sass', '.css'],      // File extensions
            plugins: [autoprefixer, postcssPresetEnv],   // Postcss plugins to use
            sourceMap,                                   // Potentially generate sourcemaps
            use: ['sass'],                               // Use sass / dart-sass
         };

         return postcss(postcssConfig);
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
      ev.eventbus.on('typhonjs:oclif:rollup:plugins:input:get', PluginHandler.getInputPlugin, PluginHandler);
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
