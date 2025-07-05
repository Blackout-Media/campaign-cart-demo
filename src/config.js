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
    }
  },
  filePatterns: {
    html: '**/*.html'
  }
};

export default config;