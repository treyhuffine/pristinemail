const fs = require('fs'),
  cheerio = require('cheerio'),
  suppoertMatrix = require('./support-matrix.json'),
  Queue = require("queue-fifo");


const file = './example.html',
  platforms = [
    'gmail',
    'gmail-android',
    'apple-mail',
    'apple-ios',
    'yahoo-mail',
    'outlook',
    'outlook-legacy',
    'outlook-web',
  ];

function htmlEmailStyleValidation(fileName) {
  const $ = cheerio.load(fs.readFileSync(fileName)),
    $root = $('body')[0],
    queue = new Queue();

  queue.enqueue($root);

  while (!queue.isEmpty()) {
    const node = $(queue.dequeue()),
      children = node.children();

    validateNodeStyle(node);

    if (children.length) {
      for (let i = 0; i < children.length; i++) {
        let child = children[i];

        queue.enqueue(child);
      }
    }
  }
}

function validateNodeStyle(node) {
  const css = node.css();

  for (let style in css) {
    const compatabilityInfo = suppoertMatrix[style],
      unsupported = [],
      messages = new Map();

    if (compatabilityInfo) {
      platforms.forEach((platform) => {
        const platformSupport = compatabilityInfo[platform]

        if (typeof platformSupport === 'string') {
          const msg = platformSupport;

          if (!messages.has(msg)) {
            messages.set(msg, []);
          }

          messages.get(msg).push(platform);
        } else if (!platformSupport) {
          unsupported.push(platform);
        }
      });
    } else {
       // console.error(`Unknown style property '${style}'.`);
    }

    for (const [msg, platforms] of messages) {
      console.warn(`Warning: Style property '${style}' in ${platforms.join(', ')}: ${msg.toLowerCase()}`)
    }

    if (unsupported.length) {
      console.error(`Style property '${style}' on '<${node[0].name}>' not supported in: ${unsupported.join(', ')}.`)
    }
  }
}

htmlEmailStyleValidation(file);
