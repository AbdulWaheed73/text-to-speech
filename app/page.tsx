'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [text3, setText3] = useState('');
  const [isLoading1, setIsLoading1] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isLoading3, setIsLoading3] = useState(false);
  const [error1, setError1] = useState('');
  const [error2, setError2] = useState('');
  const [error3, setError3] = useState('');
  const [browserSupport, setBrowserSupport] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [availableLanguages, setAvailableLanguages] = useState<{code: string, name: string}[]>([]);

  // Language name mapping
  const getLanguageName = (langCode: string): string => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'pl': 'Polish',
      'tr': 'Turkish',
      'sv': 'Swedish',
      'da': 'Danish',
      'fi': 'Finnish',
      'no': 'Norwegian',
      'cs': 'Czech',
      'el': 'Greek',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
    };
    const baseCode = langCode.split('-')[0];
    return languageNames[baseCode] || langCode;
  };

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (!('speechSynthesis' in window)) {
      setBrowserSupport(false);
      return;
    }

    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Extract unique languages
      const langSet = new Set<string>();
      const langMap = new Map<string, string>();

      availableVoices.forEach(voice => {
        const baseCode = voice.lang.split('-')[0];
        if (!langSet.has(baseCode)) {
          langSet.add(baseCode);
          langMap.set(baseCode, getLanguageName(voice.lang));
        }
      });

      const langs = Array.from(langMap.entries())
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableLanguages(langs);

      // Set default voice (first one or English voice)
      if (availableVoices.length > 0 && !selectedVoice) {
        const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    // Voices might load asynchronously
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Filter voices by selected language
  const filteredVoices = selectedLanguage === 'all'
    ? voices
    : voices.filter(voice => voice.lang.startsWith(selectedLanguage));

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);

    // Auto-select first voice in the new language
    if (langCode !== 'all') {
      const voicesInLang = voices.filter(v => v.lang.startsWith(langCode));
      if (voicesInLang.length > 0) {
        setSelectedVoice(voicesInLang[0].name);
      }
    } else if (voices.length > 0) {
      const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      setSelectedVoice(defaultVoice.name);
    }
  };

  // Web Speech API Handler (Free, Browser-based)
  const handleWebSpeechSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError1('');

    if (!text1.trim()) {
      setError1('Please enter some text');
      return;
    }

    if (!browserSupport) {
      setError1('Your browser does not support Web Speech API');
      return;
    }

    setIsLoading1(true);

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text1);

      // Set selected voice
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }

      // Configure voice settings
      utterance.rate = 1.0; // Speed
      utterance.pitch = 1.0; // Pitch
      utterance.volume = 1.0; // Volume

      utterance.onend = () => {
        setIsLoading1(false);
      };

      utterance.onerror = (event) => {
        setError1('Speech synthesis failed: ' + event.error);
        setIsLoading1(false);
      };

      window.speechSynthesis.speak(utterance);

    } catch (err) {
      setError1('Failed to generate speech. Please try again.');
      console.error('Error:', err);
      setIsLoading1(false);
    }
  };

  // OpenAI TTS Handler (Requires API key & credits)
  const handleOpenAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError2('');

    if (!text2.trim()) {
      setError2('Please enter some text');
      return;
    }

    setIsLoading2(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text2 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      console.log('Audio blob received:', audioBlob.size, 'bytes, type:', audioBlob.type);

      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('Audio URL created:', audioUrl);

      const audio = new Audio(audioUrl);

      // Add event listeners for debugging
      audio.onloadeddata = () => {
        console.log('Audio data loaded successfully');
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError2('Failed to play audio. Check console for details.');
        URL.revokeObjectURL(audioUrl);
      };

      audio.onended = () => {
        console.log('Audio playback ended');
        URL.revokeObjectURL(audioUrl);
      };

      audio.onplay = () => {
        console.log('Audio started playing');
      };

      // Load and play the audio
      try {
        audio.load();
        console.log('Attempting to play audio...');
        await audio.play();
        console.log('Audio.play() promise resolved');
      } catch (playError) {
        console.error('Play error:', playError);
        setError2(`Playback failed: ${playError instanceof Error ? playError.message : 'Unknown error'}`);
      }

    } catch (err) {
      setError2(err instanceof Error ? err.message : 'Failed to generate speech');
      console.error('Error:', err);
    } finally {
      setIsLoading2(false);
    }
  };

  // Agora TTS Handler (Requires Agora credentials)
  const handleAgoraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError3('');

    if (!text3.trim()) {
      setError3('Please enter some text');
      return;
    }

    setIsLoading3(true);

    try {
      const response = await fetch('/api/agora-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text3 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      console.log('Agora audio blob received:', audioBlob.size, 'bytes, type:', audioBlob.type);

      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('Agora audio URL created:', audioUrl);

      const audio = new Audio(audioUrl);

      // Add event listeners for debugging
      audio.onloadeddata = () => {
        console.log('Agora audio data loaded successfully');
      };

      audio.onerror = (e) => {
        console.error('Agora audio playback error:', e);
        setError3('Failed to play audio. Check console for details.');
        URL.revokeObjectURL(audioUrl);
      };

      audio.onended = () => {
        console.log('Agora audio playback ended');
        URL.revokeObjectURL(audioUrl);
      };

      audio.onplay = () => {
        console.log('Agora audio started playing');
      };

      // Load and play the audio
      try {
        audio.load();
        console.log('Attempting to play Agora audio...');
        await audio.play();
        console.log('Agora audio.play() promise resolved');
      } catch (playError) {
        console.error('Agora play error:', playError);
        setError3(`Playback failed: ${playError instanceof Error ? playError.message : 'Unknown error'}`);
      }

    } catch (err) {
      setError3(err instanceof Error ? err.message : 'Failed to generate speech');
      console.error('Agora error:', err);
    } finally {
      setIsLoading3(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-3 text-gray-800 dark:text-white">
          Text to Speech Comparison
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-lg">
          Compare three different text-to-speech engines
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Web Speech API Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Web Speech API
              </h2>
              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-semibold px-3 py-1 rounded-full">
                FREE
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              🌍 Multi-language support • Browser-based • Works offline • No API key needed
            </p>

            <form onSubmit={handleWebSpeechSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="language-select"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Select Language
                </label>
                <select
                  id="language-select"
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  disabled={isLoading1 || availableLanguages.length === 0}
                >
                  <option value="all">All Languages ({voices.length} voices)</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="voice-select"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Select Voice
                  {selectedLanguage !== 'all' && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({filteredVoices.length} available)
                    </span>
                  )}
                </label>
                <select
                  id="voice-select"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  disabled={isLoading1 || filteredVoices.length === 0}
                >
                  {filteredVoices.length === 0 ? (
                    <option>No voices available</option>
                  ) : (
                    filteredVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang}) {voice.localService ? '🏠' : '☁️'}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  🏠 = Local voice, ☁️ = Cloud voice
                </p>
              </div>

              <div>
                <label
                  htmlFor="text-input-1"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Enter your text
                </label>
                <textarea
                  id="text-input-1"
                  value={text1}
                  onChange={(e) => setText1(e.target.value)}
                  placeholder="Type something here..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none transition-all"
                  rows={5}
                  disabled={isLoading1}
                />
              </div>

              {error1 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                  {error1}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading1 || !browserSupport}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isLoading1 ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Speaking...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play with Browser TTS
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ✓ No setup required<br/>
                ✓ Works offline<br/>
                ✓ Instant playback
              </p>
            </div>
          </div>

          {/* OpenAI TTS Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                OpenAI TTS
              </h2>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
                PREMIUM
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              High-quality AI voices via Vercel AI SDK
            </p>

            <form onSubmit={handleOpenAISubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="text-input-2"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Enter your text
                </label>
                <textarea
                  id="text-input-2"
                  value={text2}
                  onChange={(e) => setText2(e.target.value)}
                  placeholder="Type something here..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none transition-all"
                  rows={5}
                  disabled={isLoading2}
                />
              </div>

              {error2 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                  {error2}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading2}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isLoading2 ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play with OpenAI TTS
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ✓ Natural-sounding voices<br/>
                ✓ Multiple voice options<br/>
                ⚠ Requires API key & credits
              </p>
            </div>
          </div>

          {/* Agora TTS Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Agora TTS
              </h2>
              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs font-semibold px-3 py-1 rounded-full">
                AZURE
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Azure-powered TTS (used by Agora&apos;s platform)
            </p>

            <form onSubmit={handleAgoraSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="text-input-3"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Enter your text
                </label>
                <textarea
                  id="text-input-3"
                  value={text3}
                  onChange={(e) => setText3(e.target.value)}
                  placeholder="Type something here..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none transition-all"
                  rows={5}
                  disabled={isLoading3}
                />
              </div>

              {error3 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                  {error3}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading3}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isLoading3 ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play with Agora TTS
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ✓ Enterprise-grade (Azure)<br/>
                ✓ Neural voice models<br/>
                ⚠ Requires Azure Speech key
              </p>
            </div>
          </div>

        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 Start with Web Speech API - it&apos;s completely free! OpenAI TTS and Agora TTS require API credentials.
          </p>
        </div>

        {/* Example Phrases Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span>🌍</span> Example Phrases to Try
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Click any phrase to copy it to the Web Speech API input field, or copy-paste manually
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { lang: 'English', code: 'en', text: 'Hello, how are you?' },
              { lang: 'Spanish', code: 'es', text: 'Hola, ¿cómo estás?' },
              { lang: 'French', code: 'fr', text: 'Bonjour, comment ça va?' },
              { lang: 'German', code: 'de', text: "Hallo, wie geht's?" },
              { lang: 'Italian', code: 'it', text: 'Ciao, come stai?' },
              { lang: 'Portuguese', code: 'pt', text: 'Olá, como está?' },
              { lang: 'Chinese', code: 'zh', text: '你好吗？' },
              { lang: 'Japanese', code: 'ja', text: 'こんにちは' },
              { lang: 'Korean', code: 'ko', text: '안녕하세요' },
              { lang: 'Arabic', code: 'ar', text: 'مرحبا، كيف حالك؟' },
              { lang: 'Russian', code: 'ru', text: 'Привет, как дела?' },
              { lang: 'Hindi', code: 'hi', text: 'नमस्ते, आप कैसे हैं?' },
            ].map((example) => (
              <button
                key={example.code}
                onClick={() => {
                  setText1(example.text);
                  handleLanguageChange(example.code);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800 dark:text-white text-sm">
                    {example.lang}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to use
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
                  {example.text}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              💡 Tip: Clicking an example will automatically set the language and fill the text input. Scroll up to see the changes!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
