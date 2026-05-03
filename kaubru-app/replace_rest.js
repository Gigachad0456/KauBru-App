const fs = require('fs');

function replaceHeader(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(regex, replacement);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Replaced in', filePath);
  } else {
    console.log('No match found in', filePath);
  }
}

const qRegex = /<View style=\{styles\.header\}>[\s\S]*?<Text style=\{styles\.headerTitle\}>Results<\/Text>[\s\S]*?<\/View>/;
replaceHeader('src/screens/QuizScreen.tsx', qRegex, '<Header title="Results" showBack={true} />');

const lRegex = /\{\/\*\s*Header\s*\*\/\}[\s\S]*?<View style=\{styles\.header\}>[\s\S]*?<Text style=\{styles\.headerTitle\} numberOfLines=\{1\}>\{lesson\.title\}<\/Text>[\s\S]*?<\/View>/;
replaceHeader('src/screens/LessonDetailScreen.tsx', lRegex, '<Header title={lesson.title} showBack={true} />');
