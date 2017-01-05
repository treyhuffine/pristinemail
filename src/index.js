import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import Queue from 'queue-fifo';
import chalk from 'chalk';
import supportMatrix from './support-matrix.json';

const unsupported = new Map(),
  unrecognized = new Set(),
  file = path.join(__dirname, '../examples/example.html'),
  platforms = [
    'gmail',
    'gmail-android',
    'apple-mail',
    'apple-ios',
    'yahoo-mail',
    'outlook',
    'outlook-legacy',
    'outlook-web'
  ];

function validateNodeStyle(node) {
  const css = node.css();

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
}

function printWarnings(source) {
  console.log(chalk.bold.underline(`\nSource: ${source} \n`));

  if (unrecognized.size > 0) {
    console.log(chalk.white.bgYellow(' Unrecognized styles: '));
    console.log('');

    unrecognized.forEach((style) => {
      console.log(chalk.yellow(`  * ${style}\n`));
    });

    console.log(chalk.cyan('\n----------------------------------------- \n\n'));
  }

  if (unsupported.size > 0) {
    console.log(chalk.white.bgRed(' Unsupported Styles: '));
    console.log('');

    for (const [style, styleUsage] of unsupported) {
      const styleNameText = chalk.red.bold(` ${style} - `),
        occurences = styleUsage.occurences / styleUsage.platforms.size,
        occurencesText = `${occurences} occurences`;

      console.log(styleNameText + occurencesText);

      for (const [platform, message] of styleUsage.platforms) {
        console.log(chalk.red(`   * ${platform}${message}`));
      }

      console.log('');
    }
  }
}

function saveWarningsToFile(source, filePath) {
  const writePath = path.join(__dirname, './validation.txt'),
    writeStream = fs.createWriteStream(writePath);

  writeStream.write(`Source: ${source} \n\n`);

  if (unrecognized.size > 0) {
    writeStream.write('Unrecognized styles:\n\n');
    writeStream.write('');

    unrecognized.forEach((style) => {
      writeStream.write(`  * ${style}\n`);
    });

    writeStream.write('\n----------------------------------------- \n\n');
  }

  if (unsupported.size > 0) {
    writeStream.write('Unsupported Styles:\n');

    for (const [style, styleUsage] of unsupported) {
      const styleNameText = `\n ${style} - `,
        occurences = styleUsage.occurences / styleUsage.platforms.size,
        occurencesText = `${occurences} occurences\n`;

      writeStream.write(styleNameText + occurencesText);

      for (const [platform, message] of styleUsage.platforms) {
        writeStream.write(`   * ${platform}${message}\n`);
      }
    }
  }

  writeStream.end();

  console.log(`File saved to ${writePath}`);
}

function parseHtml(html, source) {
  const $ = cheerio.load(html),
    $root = $('body')[0],
    queue = new Queue();

  queue.enqueue($root);

  while (!queue.isEmpty()) {
    const node = $(queue.dequeue()),
      children = node.children();

    validateNodeStyle(node);

    if (children.length) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        queue.enqueue(child);
      }
    }
  }
}

export function validateFile(fileName, options = {}) {
  const html = fs.readFileSync(fileName);
  parseHtml(html, fileName);

  if (options.writeFile && options.filePath) {
    saveWarningsToFile(fileName, options.filePath)
  } else {
    printWarnings(fileName);
  }
}

export function validateUrl(url, options = {}) {
  fetch(url)
    .then((res) => res.text())
    .then((html) => {
      parseHtml(html, url);

      if (options.writeFile && options.filePath) {
        saveWarningsToFile(url, options.filePath)
      } else {
        printWarnings(url);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

validateFile(file, {
  writeFile: true,
  filePath: __dirname
});
validateFile(file);
