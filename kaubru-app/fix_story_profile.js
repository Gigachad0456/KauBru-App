const fs = require('fs');
let c = fs.readFileSync('src/screens/StoryDetailScreen.tsx', 'utf8');

c = c.replace(/\s*\{\/\*\s*Profile button\s*\*\/\}\s*<TouchableOpacity[\s\S]*?<\/TouchableOpacity>/, '');

fs.writeFileSync('src/screens/StoryDetailScreen.tsx', c);
