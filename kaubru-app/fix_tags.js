const fs = require('fs');
const files = ['src/screens/StoriesScreen.tsx', 'src/screens/SavedWordsScreen.tsx', 'src/screens/PronunciationScreen.tsx'];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/(<Header[^>]+>)\s*<\/View>/, '$1');
  fs.writeFileSync(f, c);
  console.log('Fixed', f);
});
