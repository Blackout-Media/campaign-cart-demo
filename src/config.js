export const config = {
  inputDir: 'import',
  outputDir: 'dist',
  processors: {
    removeWebflowAttributes: {
      enabled: true,
      attributes: ['data-wf-page', 'data-wf-site']
    },
    removeGoogleFontsAndWebflowJS: {
      enabled: true
    },
    injectCustomCSS: {
      enabled: true
    },
    relocateCampaignScripts: {
      enabled: true,
      dnsPrefetch: [
        '//campaigns.apps.29next.com',
        '//cdn-countries.muddy-wind-c7ca.workers.dev'
      ],
      scripts: [
        { src: 'config.js', external: false },
        { src: 'https://campaign-cart-v2.pages.dev/loader.js', external: true }
      ]
    },
    removeWebflowComment: {
      enabled: true
    }
  },
  beautify: {
    enabled: true
  },
  filePatterns: {
    html: '**/*.html'
  },
  copyAssets: {
    enabled: true,
    folders: ['css', 'js', 'images'],
    customFiles: [
      { from: 'src/static/custom.css', to: 'css/custom.css' },
      { from: 'src/static/config.js', to: 'config.js' }
    ]
  }
};

export default config;