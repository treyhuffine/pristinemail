import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import Queue from 'queue-fifo';
import chalk from 'chalk';
import marked from 'marked';
import supportMatrix from './support-matrix.json';

const file = path.join(__dirname, '../examples/example.html'),
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

function validateNodeStyle(node, warnings) {
  const { unrecognized, unsupported } = warnings,
    css = node.css();

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

function logWarnings(warnings, source) {
  const { unrecognized, unsupported } = warnings;
  console.log(chalk.bold.underline(`\nSource: ${source} \n`));

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

    console.log(chalk.cyan('\n----------------------------------------- \n\n'));
  }

  if (unrecognized.size > 0) {
    console.log(chalk.white.bgYellow(' Unrecognized styles: '));
    console.log('');

    unrecognized.forEach((style) => {
      console.log(chalk.yellow(`  * ${style}`));
    });

    console.log('');
  }
}

function writeWarningsToMarkdown(warnings, source) {
  const { unrecognized, unsupported } = warnings,
    writePath = path.join(__dirname, './validation.md');
  let fileText = '';

  fileText += `## Source: [${source}](${source}) \n\n`;

  if (unsupported.size > 0) {
    fileText += '### Unsupported Styles:\n';

    for (const [style, styleUsage] of unsupported) {
      const styleNameText = `__\`${style}\`__ - `,
        occurences = styleUsage.occurences / styleUsage.platforms.size,
        occurencesText = `${occurences} occurences \n`;

      fileText += styleNameText + occurencesText;

      for (const [platform, message] of styleUsage.platforms) {
        fileText += ` * ${platform}${message}\n`;
      }

      fileText += '\n';
    }

    fileText += '\n___ \n';
  }

  if (unrecognized.size > 0) {
    fileText += '### Unrecognized styles:\n\n';

    unrecognized.forEach((style) => {
      fileText += `* ${style}\n`;
    });
  }

  fs.writeFileSync(writePath, fileText);

  console.log(chalk.green(`* Markdown saved to ${writePath}`));
}

function parseHtml(html, source) {
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

function processWarnings(warnings, source, options = {}) {
  const outputMethods = {
    'markdown': writeWarningsToMarkdown,
    'print': logWarnings
  }

  if (!options.output) {
    outputMethods.print(warnings, source);
  } else if (Array.isArray(options.output)) {
    options.output.forEach((method) => {
      if (outputMethods[method]) {
        outputMethods[method](warnings, source);
      }
    });
  } else if (typeof options.output === 'string') {
      if (outputMethods[options.output]) {
        outputMethods[options.output](warnings, source)
      }
  } else {
    return new Error('Incompatible output method');
  }
}

export function validateFile(fileName, options = {}) {
  const html = fs.readFileSync(fileName),
    warnings = parseHtml(html, fileName);

  processWarnings(warnings, fileName, options);
}

export function validateUrl(url, options = {}) {
  fetch(url)
    .then((res) => res.text())
    .then((html) => {
      const warnings = parseHtml(html, url);

      processWarnings(warnings, url, options);
    })
    .catch((err) => {
      console.log(err);
    });
}

function buildHtml(markdown) {
  const html =
    `<!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            padding: 0 40px;
          }
          #unsupported-styles- {
            color: red;
          }
          #unrecognized-styles- {
            color: orange;
          }
          code {
            backround-color: #F7F7F7;
            padding: 2px;
          }
          h2 {
            margin-left: -30px;
          }
        </style>
      </head>
      <body>
        ${markdown}
      </body>
    </html>`;

    return html;
}

export function markdownToHtml(fileName, options = {}) {
  fs.readFile(fileName, 'utf-8', (err, data) => {
    const html = buildHtml(marked(data));
    if (options.writeFile && options.writePath) {
      fs.writeFile(options.writePath, html);

      console.log(chalk.blue(`* HTML saved to ${options.writePath}`));
    }

    return html;
  });
}

validateFile(file, {output: ['markdown', 'print']});
markdownToHtml(path.join(__dirname, './validation.md'), {
  writeFile: true,
  writePath: path.join(__dirname, './validation.html')
});
