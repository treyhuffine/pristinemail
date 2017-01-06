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

function containsMessage(supportCriteria) {
    return typeof supportCriteria === 'string';
}

function addConflict(conflict, platform, message) {
  conflict.occurences++;
  conflict.platforms.set(platform, message);

  return conflict;
}

export function validateNodeStyle(node, emailAnalysis, options = {}) {
  const { unsupported, warning, unrecognized } = emailAnalysis,
    css = node.css(),
    platforms = PLATFORMS;

  for (const style in css) {
    const compatabilityInfo = supportMatrix[style];

    if (compatabilityInfo) {
      platforms.forEach((platform) => {
        const platformSupport = compatabilityInfo[platform];
        let message = '';

        if (containsMessage(platformSupport)) {
          if (!warning.has(style)) {
            warning.set(style, {
              occurences: 0,
              platforms: new Map()
            });
          }

          const potentialConflict = warning.get(style);

          message = `: ${platformSupport.toLowerCase()}`;

          warning.set(
            style,
            addConflict(potentialConflict, platform, message)
          );
        } else if (!platformSupport) {
          if (!unsupported.has(style)) {
            unsupported.set(style, {
              occurences: 0,
              platforms: new Map()
            });
          }

          const unsupportedStyle = unsupported.get(style);

          unsupported.set(
            style,
            addConflict(unsupportedStyle, platform, message)
          );
        }
      });
    } else {
      if (!unrecognized.has(style)){
        unrecognized.add(style)
      }
    }
  }

  return { unsupported, warning, unrecognized };
}



export function parseHtml(html, source) {
  const $ = cheerio.load(html),
    $root = $('body')[0],
    queue = new Queue();
  let emailAnalysis = {
      unsupported: new Map(),
      warning: new Map(),
      unrecognized: new Set()
    };

  queue.enqueue($root);

  while (!queue.isEmpty()) {
    const node = $(queue.dequeue()),
      children = node.children();

    emailAnalysis = validateNodeStyle(node, emailAnalysis);

    if (children.length) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        queue.enqueue(child);
      }
    }
  }

  return emailAnalysis;
}
