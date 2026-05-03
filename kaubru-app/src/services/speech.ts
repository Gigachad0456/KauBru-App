import * as Speech from 'expo-speech';

/**
 * Speaks text using the device's built-in TTS engine.
 *
 * For KauBru words we use a slow rate so each syllable is clear.
 * English uses normal rate.
 */

let isSpeaking = false;

/**
 * Finds a male voice on the device for a given language.
 */
async function getMaleVoice(lang: string) {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    
    // Filter by language and male characteristics
    const maleVoices = voices.filter(v => 
      v.language.startsWith(lang) && 
      (
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('david') || 
        v.name.toLowerCase().includes('daniel') || 
        v.name.toLowerCase().includes('arthur') || 
        v.name.toLowerCase().includes('google-m') || 
        v.name.toLowerCase().includes('sfg')
      )
    );

    // Prioritize 'Enhanced' quality voices first
    return maleVoices.find(v => v.quality === Speech.VoiceQuality.Enhanced) || maleVoices[0] || null;
  } catch {
    return null;
  }
}

export async function speak(text: string, language: 'en' | 'kb' = 'en') {
  if (isSpeaking) {
    await Speech.stop();
  }

  isSpeaking = true;
  const targetLang = language === 'kb' ? 'hi-IN' : 'en-US';
  const maleVoice = await getMaleVoice(targetLang.split('-')[0]);

  const options: Speech.SpeechOptions = {
    language: targetLang,
    // Significantly lower pitch to 0.65 for a deep masculine tone
    pitch: 0.65,
    rate: language === 'kb' ? 0.75 : 0.85,
    voice: maleVoice?.identifier,
    onDone: () => { isSpeaking = false; },
    onError: () => { isSpeaking = false; },
    onStopped: () => { isSpeaking = false; },
  };

  Speech.speak(text, options);
}

export async function stopSpeech() {
  isSpeaking = false;
  await Speech.stop();
}

export function getIsSpeaking() {
  return isSpeaking;
}
