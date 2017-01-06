import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export function logWarnings(warnings, source) {
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

export function writeWarningsToMarkdown(
  warnings,
  source,
  writePath = './validation.md'
) {
  const { unrecognized, unsupported } = warnings;
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

  console.log(chalk.green(`* Markdown saved to ${writePath}\n`));
}

export function processWarnings(warnings, source, writePath, options = {}) {
  const outputMethods = {
    'markdown': writeWarningsToMarkdown,
    'print': logWarnings
  }

  if (!options.output) {
    outputMethods.print(warnings, source);
  } else if (Array.isArray(options.output)) {
    options.output.forEach((method) => {
      if (outputMethods[method]) {
        outputMethods[method](warnings, source, writePath);
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
