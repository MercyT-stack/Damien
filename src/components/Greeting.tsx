import React, { useMemo } from "react";
import { AngelLogo } from "./AngelLogo";
import { getDynamicGreeting } from "../config/angel";
import { useAuth } from "../contexts/AuthContext";
import { useMemory } from "../contexts/MemoryContext";
import { Sparkles, Compass, Lightbulb, PenLine, Terminal } from "lucide-react";

interface GreetingProps {
  onSelectPrompt: (prompt: string) => void;
}

export const Greeting: React.FC<GreetingProps> = ({ onSelectPrompt }) => {
  const { user } = useAuth();
  const { memoryPreferences } = useMemory();
  const greetingName =
    memoryPreferences?.preferred_name?.trim() ||
    user?.username ||
    user?.display_name?.split(" ")[0] ||
    user?.name?.split(" ")[0] ||
    undefined;

  const { greeting, subtitle } = useMemo(() => {
    return getDynamicGreeting(greetingName);
  }, [greetingName]);

  const suggestionPrompts = [
    {
      icon: <Lightbulb className="w-4 h-4 text-cyan-500" />,
      title: "Explore an Idea",
      prompt: "I'm thinking about a new strategy for my project. Help me analyze the trade-offs.",
    },
    {
      icon: <Compass className="w-4 h-4 text-cyan-500" />,
      title: "Plan & Structure",
      prompt: "Help me structure an end-to-end execution plan for launching an intelligent product.",
    },
    {
      icon: <PenLine className="w-4 h-4 text-cyan-500" />,
      title: "Refine & Draft",
      prompt: "Draft an executive brief that communicates clarity, high conviction, and precision.",
    },
    {
      icon: <Terminal className="w-4 h-4 text-cyan-500" />,
      title: "Technical Reasoning",
      prompt: "Explain how modern distributed systems handle strong consistency vs eventual consistency.",
    },
  ];

  return (
    <div id="angel-dynamic-greeting" className="flex flex-col items-center justify-center max-w-2xl mx-auto px-4 py-8 text-center animate-fadeIn">
      {/* Refined Angel Emblem */}
      <div className="mb-5 relative">
        <AngelLogo size="lg" />
      </div>

      {/* Dynamic Headline */}
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2">
        {greeting}
      </h1>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-8 leading-relaxed">
        {subtitle}
      </p>

      {/* Starter Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {suggestionPrompts.map((item, idx) => (
          <button
            key={idx}
            id={`btn-suggestion-${idx}`}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-100/80 hover:bg-neutral-200/80 dark:bg-neutral-900/60 dark:hover:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-800/80 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 transition-all duration-150 group"
          >
            <div className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              {item.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {item.title}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5 leading-snug">
                {item.prompt}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
