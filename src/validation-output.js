import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

function printConflict(conflicts) {
  for (const [style, styleUsage] of conflicts) {
    const styleNameText = chalk.yellow.bold(` ${style} - `),
      occurences = styleUsage.occurences / styleUsage.platforms.size,
      occurencesText = `${occurences} occurences`;

    console.log(styleNameText + occurencesText);

    for (const [platform, message] of styleUsage.platforms) {
      console.log(chalk.yellow(`   * ${platform}${message}`));
    }

    console.log('');
  }
}

function markdownConflict(conflicts) {
  let markdown = '';

  for (const [style, styleUsage] of conflicts) {
    const styleNameText = `__\`${style}\`__ - `,
      occurences = styleUsage.occurences / styleUsage.platforms.size,
      occurencesText = `${occurences} occurences \n`;

    markdown += styleNameText + occurencesText;

    for (const [platform, message] of styleUsage.platforms) {
      markdown += ` * ${platform}${message}\n`;
    }

    markdown += '\n';
  }

  return markdown;
}

export function logAnalysis(emailAnalysis, emailSource) {
  const { unrecognized, warning, unsupported } = emailAnalysis;
  console.log(chalk.bold.underline(`\nSource: ${emailSource} \n`));

  if (unsupported.size > 0) {
    console.log(chalk.white.bgRed(' Unsupported Styles: '));
    console.log('');

    printConflict(unsupported)

    console.log(chalk.cyan('\n----------------------------------------- \n\n'));
  }

  if (warning.size > 0) {
    console.log(chalk.white.bgYellow(' Potential Conflict Warning: '));
    console.log(chalk.yellow(
      ['These styles may not be fully supported.',
      ' Verify your email uses them appropriately.\n'].join('')
    ));

    printConflict(warning)

    console.log(chalk.cyan('\n----------------------------------------- \n\n'));
  }

  if (unrecognized.size > 0) {
    console.log(chalk.white.bgMagenta(' Unrecognized styles: '));
    console.log('');

    unrecognized.forEach((style) => {
      console.log(chalk.magenta(`  * ${style}`));
    });

    console.log('');
  }
}

export function writeAnalysisToMarkdown(
  emailAnalysis,
  emailSource,
  writePath = './validation.md'
) {
  const { unrecognized, warning, unsupported } = emailAnalysis;
  let fileText = '';

  fileText += `## Source: [${emailSource}](${emailSource}) \n\n`;

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

  if (unsupported.size > 0) {
    fileText += '### Potential Conflict Warning:\n';
    fileText += (
      ['#### These styles may not be fully supported.',
      ' Verify your html email uses them appropriately.\n\n'].join('')
    );

    for (const [style, styleUsage] of warning) {
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

export function processEmailAnalysis(
  emailAnalysis,
  emailSource,
  writePath,
  options = {}
) {
  const outputMethods = {
    'markdown': writeAnalysisToMarkdown,
    'print': logAnalysis
  }

  if (!options.output) {
    outputMethods.print(emailAnalysis, emailSource);
  } else if (Array.isArray(options.output)) {
    options.output.forEach((method) => {
      if (outputMethods[method]) {
        outputMethods[method](emailAnalysis, emailSource, writePath);
      }
    });
  } else if (typeof options.output === 'string') {
      if (outputMethods[options.output]) {
        outputMethods[options.output](emailAnalysis, emailSource)
      }
  } else {
    return new Error('Incompatible output method');
  }
}
