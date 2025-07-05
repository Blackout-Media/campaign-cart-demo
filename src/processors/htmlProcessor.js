import * as cheerio from 'cheerio';
import beautify from 'js-beautify';

export class HtmlProcessor {
  constructor(config) {
    this.config = config;
    this.processors = [];
    this.initializeProcessors();
  }

  initializeProcessors() {
    if (this.config.processors.removeWebflowComment?.enabled) {
      this.processors.push(this.removeWebflowComment.bind(this));
    }
    if (this.config.processors.removeWebflowAttributes?.enabled) {
      this.processors.push(this.removeWebflowAttributes.bind(this));
    }
    if (this.config.processors.removeGoogleFontsAndWebflowJS?.enabled) {
      this.processors.push(this.removeGoogleFontsAndWebflowJS.bind(this));
    }
    if (this.config.processors.removePageblockStyles?.enabled) {
      this.processors.push(this.removePageblockStyles.bind(this));
    }
    if (this.config.processors.removeFontSmoothingStyles?.enabled) {
      this.processors.push(this.removeFontSmoothingStyles.bind(this));
    }
    if (this.config.processors.injectCustomCSS?.enabled) {
      this.processors.push(this.injectCustomCSS.bind(this));
    }
    if (this.config.processors.relocateCampaignScripts?.enabled) {
      this.processors.push(this.relocateCampaignScripts.bind(this));
    }
    if (this.config.processors.relocateNextMetaTags?.enabled) {
      this.processors.push(this.relocateNextMetaTags.bind(this));
    }
    if (this.config.processors.consolidateInlineCSS?.enabled) {
      this.processors.push(this.consolidateInlineCSS.bind(this));
    }
  }

  async process(html) {
    // Remove the Webflow comment before loading into cheerio
    if (this.config.processors.removeWebflowComment?.enabled) {
      html = html.replace(/<!--\s*Last Published:.*?-->\s*/i, '');
    }
    
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

  removeWebflowComment($) {
    // Comment removal is handled in the process method before cheerio loads
    return $;
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
    
    // Remove next-staging-core.js script (handles all path variations)
    $('script[src$="next-staging-core.js"]').remove();
    $('script[src*="/next-staging-core.js"]').remove();
    $('script[src="js/next-staging-core.js"]').remove();
    $('script[src="../js/next-staging-core.js"]').remove();
    $('script[src="../../js/next-staging-core.js"]').remove();

    return $;
  }

  removePageblockStyles($) {
    // Remove the pageblock-styles div that contains the campaign-cart.css link
    $('.pageblock-styles').each((i, elem) => {
      const $elem = $(elem);
      // Check if this contains the campaign-cart.css link
      if ($elem.find('link[href*="campaign-cart.css"]').length > 0) {
        $elem.remove();
      }
    });

    return $;
  }

  removeFontSmoothingStyles($) {
    // Remove the specific style block containing font smoothing and selection styles
    $('style').each((i, elem) => {
      const $elem = $(elem);
      const styleContent = $elem.html();
      
      if (styleContent && 
          styleContent.includes('-webkit-font-smoothing') && 
          styleContent.includes('::selection') && 
          styleContent.includes('.test-mode-indicator')) {
        $elem.remove();
      }
    });

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
    
    // First, remove ALL existing campaign-related elements
    $('link[rel="dns-prefetch"][href*="campaigns.apps.29next.com"]').remove();
    $('link[rel="dns-prefetch"][href*="cdn-countries.muddy-wind-c7ca.workers.dev"]').remove();
    
    // Remove various forms of campaign scripts
    $('script[src*="campaign-cart"]').remove();
    $('script[src*="config.js"]').remove();
    $('script[src*="loader.js"]').remove();
    
    // Also remove the specific URLs from the original files
    $('script[src="https://campaign-cart-v2.pages.dev/config.js"]').remove();
    $('script[src="https://campaign-cart-v2.pages.dev/loader.js"]').remove();
    
    // Find the FIRST viewport meta tag only
    const viewportMeta = $('meta[name="viewport"]').first();
    
    if (viewportMeta.length > 0) {
      // Build the campaign scripts block
      let campaignBlock = '\n\n';
      
      // Add DNS prefetch links
      config.dnsPrefetch.forEach(href => {
        campaignBlock += `  <link rel="dns-prefetch" href="${href}">\n`;
      });
      
      // Add empty line before scripts
      campaignBlock += '\n';
      
      // Add script tags with comments
      config.scripts.forEach(script => {
        if (script.external) {
          // Add comment for loader.js
          campaignBlock += `  <!-- Campaign Loader Script -->\n`;
          campaignBlock += `  <script src="${script.src}"></script>\n`;
        } else {
          // For local config.js, calculate relative path
          const htmlDepth = $('link[href*="/css/"]').first().attr('href');
          let relativePath = '';
          
          if (htmlDepth) {
            const depth = (htmlDepth.match(/\.\.\//g) || []).length;
            relativePath = '../'.repeat(depth);
          }
          
          // Add comment for config.js
          campaignBlock += `  <!-- Campaign Configuration -->\n`;
          campaignBlock += `  <script src="${relativePath}${script.src}"></script>\n`;
        }
      });
      
      campaignBlock += '\n';
      
      // Insert after FIRST viewport meta only
      viewportMeta.after(campaignBlock);
    }

    return $;
  }

  relocateNextMetaTags($) {
    // Find all meta tags with names containing "next-"
    const nextMetaTags = $('meta[name*="next-"]');
    
    if (nextMetaTags.length > 0) {
      // Remove the meta tags from their current position
      const metaTagsHtml = [];
      nextMetaTags.each((i, elem) => {
        const $elem = $(elem);
        metaTagsHtml.push($elem.prop('outerHTML'));
        $elem.remove();
      });
      
      // Find the last campaign script (loader.js)
      const loaderScript = $('script[src*="campaign-cart-v2.pages.dev/loader.js"]').last();
      
      if (loaderScript.length > 0) {
        // Add empty line, comment, then meta tags (no empty line between comment and tags)
        let metaBlock = '\n\n';
        metaBlock += '  <!-- NEXT Metatags -->\n';
        metaTagsHtml.forEach(metaHtml => {
          metaBlock += `  ${metaHtml}\n`;
        });
        
        loaderScript.after(metaBlock);
      }
    }

    return $;
  }

  consolidateInlineCSS($) {
    // Find all custom-css w-embed divs
    const customCssDivs = $('.custom-css.w-embed');
    
    if (customCssDivs.length > 0) {
      const cssBlocks = new Map(); // Use Map to track unique CSS blocks
      
      // Collect all CSS content
      customCssDivs.each((i, elem) => {
        const $div = $(elem);
        const $style = $div.find('style');
        
        if ($style.length > 0) {
          const cssContent = $style.html().trim();
          if (cssContent) {
            // Use the CSS content as key to avoid duplicates
            cssBlocks.set(cssContent, cssContent);
          }
        }
        
        // Remove the original div
        $div.remove();
      });
      
      // If we have CSS to consolidate
      if (cssBlocks.size > 0) {
        // Create consolidated style tag
        let consolidatedCSS = '\n  <!-- Consolidated Custom CSS -->\n';
        consolidatedCSS += '  <style>\n';
        
        // Add all unique CSS blocks with proper indentation
        cssBlocks.forEach(css => {
          // Split CSS into lines and re-indent properly
          const lines = css.split('\n');
          lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              // Add consistent 4-space indentation
              consolidatedCSS += '    ' + trimmedLine + '\n';
            }
          });
          // Add a blank line between CSS blocks for readability
          consolidatedCSS += '\n';
        });
        
        consolidatedCSS += '  </style>\n\n';
        
        // Insert before closing body tag
        $('body').append(consolidatedCSS);
      }
    }
    
    return $;
  }

  addProcessor(name, processorFn) {
    this.processors.push(processorFn.bind(this));
  }
}

export default HtmlProcessor;