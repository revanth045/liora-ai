const fs = require('fs');
const path = require('path');

const reps = [
  ['ââ ¬←', '-'], 
  ['â ¢', '•'], 
  ['â ™', "'"], 
  ['â ¨', '✨'], 
  ['ð  ½️', '🍽️'], 
  ['ð  ½', '🍽️'], 
  ['ð ¥¡', '🥡'], 
  ['ð ª ', '🪑'], 
  ['ð  ·', '🍷'], 
  ['ð §¾', '🧾'], 
  ['ð  £', '🛎️'], 
  ['ð  ¡', '🟡'], 
  ['ð  µ', '🟠'], 
  ['ð  ´', '🔴'], 
  ['ð  •', '🏃‍♂️'], 
  ['ð  ±', '🍣'], 
  ['ð  ®', '🌮'], 
  ['ð  ²', '🍲'], 
  ['ð  ¿', '💆‍♀️'], 
  ['â  ', ' '], 
  ['â –️', '📐'], 
  ['ð § ', '🧂'], 
  ['ð  ¡️', '🌡️'], 
  ['ð ¥¥', '🥥'], 
  ['ð ¥©', '🥩'], 
  ['â …', '✨'], 
  ['â Œ', '❌'], 
  ['â ¦', '...'], 
  ['â ”', '—'], 
  ['â \'', '→'], 
  ['ð ¡', '💡'], 
  ['📈', '🍝'], 
  ['🥗', '🥗'], // wait, '🥗', '🥗' is no-op
  ['ð «•', '🍕'],
  ['ð ¦ ', '🍔'],
  ['ð § ', '🌭'],
  ['ð  ¯', '🥨'],
  ['ð « ', '🥂'],
  ['â \u0099', "'"], // Sometimes apostrophes are different
];

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.match(/\.(tsx?|jsx?|md|json)$/)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      reps.forEach(([from, to]) => {
        if (content.includes(from)) {
          content = content.replaceAll(from, to);
          changed = true;
        }
      });
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  });
}

['src', 'components', 'hooks', 'services', 'store', 'utils'].forEach(d => {
  const dirPath = path.join(__dirname, d);
  if (fs.existsSync(dirPath)) {
    walk(dirPath);
  }
});
console.log("Done");
