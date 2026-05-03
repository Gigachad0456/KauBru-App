const fs = require('fs');
let c = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8');

const correctCode = `    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Translation failed.');
    } finally {
      setLoading(false);
    }
  };

  const swapDirection = () => {
    setDirection(d => d === 'en_to_kb' ? 'kb_to_en' : 'en_to_kb');
    setInputText('');
    setResult(null);
    setCharCount(0);
  };

  const clearHistory = async () => {
    setHistory([]);
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  const displayedHistory = history.slice(0, DISPLAY_HISTORY);

  return (
    <View style={styles.container}>
      <Header showProfile={true} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Direction selector */}
        <View style={styles.directionRow}>
          <TouchableOpacity
            style={[styles.langPill, direction === 'en_to_kb' && styles.langPillActive]}
            onPress={() => direction !== 'en_to_kb' && swapDirection()}
            accessibilityRole="button"
            accessibilityLabel="Translate from English"
          >
            <Text style={[styles.langText, direction === 'en_to_kb' && styles.langTextActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={swapDirection}
            style={styles.swapBtn}
            accessibilityRole="button"
            accessibilityLabel="Swap translation direction"`;

c = c.replace(/\s*\}\s*catch\s*\(err:\s*any\)\s*\{\s*accessibilityLabel="Swap translation direction"/, '\n' + correctCode);
fs.writeFileSync('src/screens/HomeScreen.tsx', c);
