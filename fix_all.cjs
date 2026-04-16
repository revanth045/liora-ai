const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

const replacements = [
  { from: /â ”/g, to: '—' },     // em-dash replacement
  { from: /â €/g, to: '-' },     // dash replacement
  { from: /â ¦/g, to: '...' },   // ellipsis
  { from: /Â /g, to: ' ' },      // non-breaking space
  { from: /â “/g, to: '-' },     // en-dash
  { from: /ââ ¬¢/g, to: '•' },   // bullet points
  { from: /â ’/g, to: '→' },     // right arrow
  { from: /â  /g, to: '←' },     // left arrow (might be different)
  { from: /ð  ¨â  ð  ³/g, to: '👨‍🍳' }, // Chef
  { from: /â€˜/g, to: "'" },     // Left single quote
  { from: /â€™/g, to: "'" },     // Right single quote
  { from: /â€œ/g, to: '"' },     // Left double quote
  { from: /â€ /g, to: '"' },     // Right double quote
  { from: /ð  ¨/g, to: '👨‍🍳' },    // Possible chef variant
  { from: /ð  ³/g, to: '👨‍🍳' },    // Possible chef variant
  // Add other emojis from the report
  { from: /ð  ¢/g, to: '🥩' },
  { from: /ð  ª/g, to: '📊' },
  { from: /ð   /g, to: '📈' },
  { from: /ð  ©/g, to: '🍱' },
  { from: /ð ¤ /g, to: '🤖' },
  { from: /ð ¥ /g, to: '🥗' },
  { from: /ð   /g, to: '🍕' }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const { from, to } of replacements) {
        if (from.test(content)) {
          content = content.replace(from, to);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed: ${fullPath.substring(__dirname.length)}`);
      }
    }
  }
}

processDirectory(dir);
console.log('Done scanning and replacing literals.');
