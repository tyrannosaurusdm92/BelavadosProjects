// Auto-generated for Belavadös Fantasy Voice Simulation JS.
// Source uploaded by user; generated package contains JS-only runtime plus docs.


import { createFantasyVoiceProfile, toSpeechSynthesisOptions } from './fantasy-voice-engine.js';

export class BrowserFantasyVoiceSpeaker {
  constructor({ voiceMatcher = null } = {}) {
    this.voiceMatcher = voiceMatcher;
  }

  getVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  }

  pickBrowserVoice(profile) {
    const voices = this.getVoices();
    if (!voices.length) return null;
    if (typeof this.voiceMatcher === 'function') {
      return this.voiceMatcher(voices, profile) || voices[0];
    }
    const lowerFeel = `${profile.selected.fantasyAccentName} ${profile.engineParams.accentCarrier.inspiration}`.toLowerCase();
    return voices.find(v => lowerFeel.includes((v.lang || '').split('-')[0].toLowerCase())) || voices[0];
  }

  speak(text, options = {}) {
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      throw new Error('Browser speech synthesis is not available in this runtime.');
    }
    const profile = options.profile || createFantasyVoiceProfile(options);
    const utterance = new SpeechSynthesisUtterance(text);
    const speech = toSpeechSynthesisOptions(profile);
    utterance.pitch = speech.pitch;
    utterance.rate = speech.rate;
    utterance.volume = speech.volume;
    const voice = this.pickBrowserVoice(profile);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    return { utterance, profile };
  }

  cancel() {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }
}
