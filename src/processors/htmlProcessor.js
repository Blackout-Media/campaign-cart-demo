import * as cheerio from 'cheerio';
import beautify from 'js-beautify';

export class HtmlProcessor {
  constructor(config) {
    this.config = config;
    this.processors = [];
    this.initializeProcessors();
  }

  initializeProcessors() {
    if (this.config.processors.removeWebflowAttributes?.enabled) {
      this.processors.push(this.removeWebflowAttributes.bind(this));
    }
    if (this.config.processors.removeGoogleFontsAndWebflowJS?.enabled) {
      this.processors.push(this.removeGoogleFontsAndWebflowJS.bind(this));
    }
    if (this.config.processors.injectCustomCSS?.enabled) {
      this.processors.push(this.injectCustomCSS.bind(this));
    }
    if (this.config.processors.relocateCampaignScripts?.enabled) {
      this.processors.push(this.relocateCampaignScripts.bind(this));
    }
  }

  async process(html) {
    let $ = cheerio.load(html, {
      xmlMode: false,
      decodeEntities: false
    });

    for (const processor of this.processors) {
      $ = await processor($);
    }

    const processedHtml = $.html();
    
    // Beautify the HTML if enabled
    if (this.config.beautify?.enabled !== false) {
      return beautify.html(processedHtml, {
        indent_size: 2,
        indent_char: ' ',
        preserve_newlines: true,
        max_preserve_newlines: 2,
        wrap_line_length: 0,
        wrap_attributes: 'auto',
        wrap_attributes_indent_size: 2,
        end_with_newline: true,
        unformatted: ['script', 'style'],
        content_unformatted: [],
        extra_liners: []
      });
    }

    return processedHtml;
  }

  removeWebflowAttributes($) {
    const attributes = this.config.processors.removeWebflowAttributes.attributes;
    
    attributes.forEach(attr => {
      $(`[${attr}]`).removeAttr(attr);
    });

    return $;
  }

  removeGoogleFontsAndWebflowJS($) {
    // Remove Google Fonts preconnect links
    $('link[href="https://fonts.googleapis.com"][rel="preconnect"]').remove();
    $('link[href="https://fonts.gstatic.com"][rel="preconnect"]').remove();
    
    // Remove WebFont loader script
    $('script[src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"]').remove();
    
    // Remove inline scripts containing WebFont.load
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (scriptContent && scriptContent.includes('WebFont.load')) {
        $(elem).remove();
      }
    });
    
    // Remove Webflow w-mod script
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (scriptContent && scriptContent.includes('w-mod-') && scriptContent.includes('ontouchstart')) {
        $(elem).remove();
      }
    });
    
    // Remove jQuery script from Cloudfront
    $('script[src*="d3e54v103j8qbb.cloudfront.net"][src*="jquery"]').remove();
    
    // Remove next-staging-core.js script (handles relative paths)
    $('script[src$="next-staging-core.js"]').remove();

    return $;
  }

  injectCustomCSS($) {
    // Find the next-staging-core.css link (handles both relative and absolute paths)
    const nextStagingCoreLinks = $('link[href$="next-staging-core.css"]');
    
    nextStagingCoreLinks.each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      
      // Extract the path prefix (e.g., '../css/', 'css/', '../../css/')
      const pathPrefix = href.substring(0, href.lastIndexOf('next-staging-core.css'));
      
      // Create the custom.css link with the same path prefix
      const customCSSLink = `<link href="${pathPrefix}custom.css" rel="stylesheet" type="text/css">`;
      
      // Insert it after next-staging-core.css
      $link.after('\n  ' + customCSSLink);
    });

    return $;
  }

  relocateCampaignScripts($) {
    const config = this.config.processors.relocateCampaignScripts;
    
    // First, remove existing campaign-related elements
    $('link[rel="dns-prefetch"][href*="campaigns.apps.29next.com"]').remove();
    $('link[rel="dns-prefetch"][href*="cdn-countries.muddy-wind-c7ca.workers.dev"]').remove();
    $('script[src*="campaign-cart"][src*="config.js"]').remove();
    $('script[src*="campaign-cart"][src*="loader.js"]').remove();
    
    // Find the viewport meta tag
    const viewportMeta = $('meta[name="viewport"]');
    
    if (viewportMeta.length > 0) {
      // Build the campaign scripts block
      let campaignBlock = '\n\n';
      
      // Add DNS prefetch links
      config.dnsPrefetch.forEach(href => {
        campaignBlock += `  <link rel="dns-prefetch" href="${href}">\n`;
      });
      
      // Add script tags
      config.scripts.forEach(script => {
        if (script.external) {
          campaignBlock += `  <script src="${script.src}"></script>\n`;
        } else {
          // For local config.js, calculate relative path
          const htmlDepth = $('link[href*="/css/"]').first().attr('href');
          let relativePath = '';
          
          if (htmlDepth) {
            const depth = (htmlDepth.match(/\.\.\//g) || []).length;
            relativePath = '../'.repeat(depth);
          }
          
          campaignBlock += `  <script src="${relativePath}${script.src}"></script>\n`;
        }
      });
      
      campaignBlock += '\n';
      
      // Insert after viewport meta with 2 blank lines
      viewportMeta.after(campaignBlock);
    }

    return $;
  }

  addProcessor(name, processorFn) {
    this.processors.push(processorFn.bind(this));
  }
}

export default HtmlProcessor;