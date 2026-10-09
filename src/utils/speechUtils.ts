/**
 * Audio / Web Speech API utilities for reading chat messages and conversation history aloud.
 */

/**
 * Clean markdown and formatting symbols from text for natural speech synthesis
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // Remove code blocks, replacing with a clean announcement
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang) => {
    const language = lang ? `${lang} code snippet` : "code snippet";
    return ` Here is a ${language}. `;
  });

  // Remove inline code ticks
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove markdown image embeds ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");

  // Replace markdown links [text](url) with just text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove markdown blockquotes
  text = text.replace(/^>\s+/gm, "");

  // Remove header hashes (# Title -> Title)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove bold / italic symbols (**bold**, *italic*, __bold__, _italic_)
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");

  // Remove strikethrough
  text = text.replace(/~~(.*?)~~/g, "$1");

  // Clean bullet points (* item, - item, + item) to smooth list items
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");

  // Clean numbered lists (1. item -> item)
  text = text.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove table separator lines (|---|---|)
  text = text.replace(/\|[\s-:]+\|/g, "");
  // Replace table pipes with commas
  text = text.replace(/\|/g, ", ");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Normalize excessive whitespace and line breaks
  text = text.replace(/\n{2,}/g, ". ");
  text = text.replace(/\n/g, " ");
  text = text.replace(/\s{2,}/g, " ");

  return text.trim();
}

/**
 * Splits long text into manageable sentence chunks (avoids Web Speech API ~15s timeout bug in Chromium)
 */
export function splitIntoSpeechChunks(text: string, maxChunkLength: number = 180): string[] {
  if (!text) return [];

  // Split on sentence boundaries: periods, questions, exclamations followed by space or newline
  const sentenceRegex = /([.?!]+(?:\s+|$)|;\s+|\n+)/;
  const rawParts = text.split(sentenceRegex);

  const sentences: string[] = [];
  let currentSentence = "";

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (!part) continue;

    if (sentenceRegex.test(part)) {
      currentSentence += part;
      if (currentSentence.trim()) {
        sentences.push(currentSentence.trim());
      }
      currentSentence = "";
    } else {
      currentSentence += part;
    }
  }

  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }

  // Combine small fragments into chunks up to maxChunkLength
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (!currentChunk) {
      currentChunk = sentence;
    } else if (currentChunk.length + sentence.length + 1 <= maxChunkLength) {
      currentChunk += " " + sentence;
    } else {
      chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Get available system speech synthesis voices safely
 */
export function getBrowserVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const immediate = window.speechSynthesis.getVoices();
    if (immediate && immediate.length > 0) {
      resolve(immediate);
      return;
    }

    // Wait for voiceschanged event
    const onVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(voices);
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);

    // Timeout fallback after 1.5 seconds
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(window.speechSynthesis.getVoices() || []);
    }, 1500);
  });
}
