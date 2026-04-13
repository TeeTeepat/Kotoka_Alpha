"use client";

import { motion } from "framer-motion";
import { WordHighlight } from "./WordHighlight";
import type { StoryWord } from "@/lib/mockData";

interface StoryDisplayProps {
  text: string;
  highlightedWords: StoryWord[];
}

export function StoryDisplay({ text, highlightedWords }: StoryDisplayProps) {
  // Create a map of word to definition for quick lookup
  const wordMap = new Map(highlightedWords.map(w => [w.word.toLowerCase(), w.definition]));

  // Split text into paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);

  // Function to process a paragraph and insert WordHighlight components
  const processParagraph = (paragraph: string) => {
    const words = paragraph.split(/(\s+)/); // Split while preserving whitespace
    let keyIndex = 0;

    return words.map((segment, idx) => {
      // Only process non-whitespace segments
      if (!segment.trim()) return <span key={`space-${idx}`}>{segment}</span>;

      const cleanSegment = segment.toLowerCase().replace(/[^a-z]/g, '');
      const definition = wordMap.get(cleanSegment);

      // Check if this word (or contains this word) should be highlighted
      const matchedWord = highlightedWords.find(hw => {
        const hwLower = hw.word.toLowerCase();
        return cleanSegment === hwLower || segment.toLowerCase().includes(hwLower);
      });

      if (matchedWord) {
        keyIndex++;
        return (
          <WordHighlight
            key={`highlight-${keyIndex}-${idx}`}
            word={segment}
            definition={matchedWord.definition}
          />
        );
      }

      return <span key={`text-${idx}`}>{segment}</span>;
    });
  };

  return (
    <div className="space-y-6">
      {paragraphs.map((paragraph, pIndex) => (
        <motion.p
          key={`paragraph-${pIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: pIndex * 0.15,
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1]
          }}
          className="font-body text-base text-dark leading-relaxed"
        >
          {processParagraph(paragraph)}
        </motion.p>
      ))}
    </div>
  );
}
