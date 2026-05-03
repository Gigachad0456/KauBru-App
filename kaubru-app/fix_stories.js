const fs = require('fs');
let c = fs.readFileSync('src/screens/StoriesScreen.tsx', 'utf8');
c = c.replace(/<\/View>\s*keyExtractor=\{i => i\}/, `</View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Folktales" subtitle="Stories of the KauBru people" showBack={true} />

      {/* Category tabs */}
      <FlatList
        data={CATEGORY_TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}`);
fs.writeFileSync('src/screens/StoriesScreen.tsx', c);
