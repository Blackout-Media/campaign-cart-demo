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
      { from: 'src/static/custom.css', to: 'css/custom.css' }
    ]
  }
};

export default config;