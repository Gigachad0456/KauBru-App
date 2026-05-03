const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Generic matching for any `<View style={styles.header}>...` up to `</View>`
  if (content.includes('styles.header') && !content.includes("import Header from '../components/Header'")) {
    
    // Replace complex headers with back button and subtitle
    content = content.replace(/\{\/\*\s*Header\s*\*\/\}\s*<View style=\{styles\.header\}>[\s\S]*?<Text style=\{styles\.title\}>([^<]+)<\/Text>\s*<Text style=\{styles\.subtitle\}>([^<]+)<\/Text>[\s\S]*?<\/View>/, '<Header title="$1" subtitle="$2" showBack={true} />');
    
    // Replace complex headers with back button and title only
    content = content.replace(/\{\/\*\s*Header\s*\*\/\}\s*<View style=\{styles\.header\}>[\s\S]*?<Text style=\{styles\.headerTitle\}>([^<]+)<\/Text>[\s\S]*?<\/View>/, '<Header title="$1" showBack={true} />');
    content = content.replace(/<View style=\{styles\.header\}>[\s\S]*?<Text style=\{styles\.headerTitle\}>([^<]+)<\/Text>[\s\S]*?<\/View>/, '<Header title="$1" showBack={true} />');

    // Add import
    if (content !== originalContent) {
      const importMatches = content.match(/import .* from '.*';\n/g);
      if (importMatches) {
        const lastImport = importMatches[importMatches.length - 1];
        content = content.replace(lastImport, lastImport + "import Header from '../components/Header';\n");
      } else {
        content = "import Header from '../components/Header';\n" + content;
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + file);
    }
  }
}
