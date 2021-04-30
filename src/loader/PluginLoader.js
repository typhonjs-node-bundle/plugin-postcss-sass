import postcss          from 'rollup-plugin-postcss';

import autoprefixer     from 'autoprefixer';
import postcssPresetEnv from 'postcss-preset-env';

const s_CONFLICT_PACKAGES = ['rollup-plugin-postcss'];
const s_PACKAGE_NAME = '@typhonjs-oclif-rollup/plugin-postcss';

const s_DEFAULT_CONFIG = () =>
{
   return {
      inject: false,                                                       // Don't inject CSS into <HEAD>
      plugins: [autoprefixer, postcssPresetEnv],                           // Postcss plugins to use
      extensions: ['.css', '.less', '.sass', '.scss', '.styl', '.stylus'], // File extensions
      use: ['sass', 'stylus', 'less'],                                     // Use sass / dart-sass
   };
};

/**
 * Handles interfacing with the plugin manager adding event bindings to pass back a configured
 * instance of `rollup-plugin-postcss` with autoprefixer, postcss, postcss-preset-env.
 */
export default class PluginLoader
{
   /**
    * Returns the any modules that cause a conflict.
    *
    * @returns {string[]} An array of conflicting packages.
    */
   static get conflictPackages() { return s_CONFLICT_PACKAGES; }

   /**
    * Returns the `package.json` module name.
    *
    * @returns {string} Package name.
    */
   static get packageName() { return s_PACKAGE_NAME; }

   /**
    * Returns the configured input plugin for `rollup-plugin-postcss`.
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

         let config;

         // Handle ignoring loading local config files if the CLI flag `--ignore-local-config` is true.
         if (typeof bundleData.cliFlags['ignore-local-config'] === 'boolean' &&
           bundleData.cliFlags['ignore-local-config'])
         {
            config = s_DEFAULT_CONFIG();
         }
         else
         {
            config = await globalThis.$$eventbus.triggerAsync('typhonjs:utils:cosmiconfig:config:load:safe', {
               moduleName: 'postcss',
               packageName: PluginLoader.packageName,
               defaultConfig: s_DEFAULT_CONFIG(),
               startDir: globalThis.$$cli_baseCWD,
               stopDir: globalThis.$$cli_origCWD
            });
         }

         config.extract = filename;    // Output CSS w/ bundle file name to the deploy directory
         config.minimize = minimize;   // Potentially minimizes
         config.sourceMap = sourceMap; // Potentially generate sourcemaps

         return postcss(config);
      }
   }

   /**
    * Wires up PluginLoader on the plugin eventbus.
    *
    * @param {object} ev - PluginInvokeEvent - The plugin event.
    *
    * @see https://www.npmjs.com/package/@typhonjs-plugin/manager
    *
    * @ignore
    */
   static async onPluginLoad(ev)
   {
      ev.eventbus.on('typhonjs:oclif:bundle:plugins:main:input:get', PluginLoader.getInputPlugin, PluginLoader);
   }
}
