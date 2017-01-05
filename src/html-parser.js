import cheerio from 'cheerio';
import Queue from 'queue-fifo';
import supportMatrix from './support-matrix.json';

const PLATFORMS = [
    'gmail',
    'gmail-android',
    'apple-mail',
    'apple-ios',
    'yahoo-mail',
    'outlook',
    'outlook-legacy',
    'outlook-web'
  ];

export function validateNodeStyle(node, warnings, options = {}) {
  const { unrecognized, unsupported } = warnings,
    css = node.css(),
    platforms = PLATFORMS;

  for (const style in css) {
    const compatabilityInfo = supportMatrix[style];

    if (compatabilityInfo) {
      platforms.forEach((platform) => {
        const platformSupport = compatabilityInfo[platform];
        let message = '';

        if (typeof platformSupport === 'string') {
          message = `: ${platformSupport.toLowerCase()}`;
        }

        if (!platformSupport || message.length > 0) {
          if (!unsupported.has(style)) {
            unsupported.set(style, {
              occurences: 0,
              platforms: new Map()
            });
          }

          const unsupportedStyle = unsupported.get(style);

          unsupportedStyle.occurences++;

          unsupportedStyle.platforms.set(platform, message);

          unsupported.set(style, unsupportedStyle);
        }
      });
    } else {
      if (!unrecognized.has(style)){
        unrecognized.add(style)
      }
    }
  }

  return { unsupported, unrecognized };
}



export function parseHtml(html, source) {
  const $ = cheerio.load(html),
    $root = $('body')[0],
    queue = new Queue();
  let warnings = {
      unsupported: new Map(),
      unrecognized: new Set()
    };

  queue.enqueue($root);

  while (!queue.isEmpty()) {
    const node = $(queue.dequeue()),
      children = node.children();

    warnings = validateNodeStyle(node, warnings);

    if (children.length) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        queue.enqueue(child);
      }
    }
  }

  return warnings;
}
