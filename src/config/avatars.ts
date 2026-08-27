export interface CharacterAvatar {
  id: string;
  name: string;
  category: "animals" | "cyber" | "fantasy";
  emoji: string;
  bgColor: string;
  svgPath: string; // SVG icon or avatar design
  url?: string;
}

export const CHARACTER_AVATARS: CharacterAvatar[] = [
  {
    id: "monkey",
    name: "Clever Monkey",
    category: "animals",
    emoji: "🐵",
    bgColor: "from-amber-500 to-orange-600",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=monkey_companion&backgroundColor=ffb74d",
  },
  {
    id: "stuffed_bear",
    name: "Stuffed Bear",
    category: "animals",
    emoji: "🧸",
    bgColor: "from-amber-600 to-yellow-700",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=stuffed_bear&backgroundColor=d7ccc8",
  },
  {
    id: "cyber_fox",
    name: "Cyber Fox",
    category: "animals",
    emoji: "🦊",
    bgColor: "from-orange-500 to-red-600",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=cyber_fox&backgroundColor=ff8a65",
  },
  {
    id: "zen_panda",
    name: "Zen Panda",
    category: "animals",
    emoji: "🐼",
    bgColor: "from-emerald-600 to-teal-700",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=zen_panda&backgroundColor=80cbc4",
  },
  {
    id: "wise_owl",
    name: "Wise Owl",
    category: "animals",
    emoji: "🦉",
    bgColor: "from-indigo-600 to-purple-700",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=wise_owl&backgroundColor=b39ddb",
  },
  {
    id: "cyber_cat",
    name: "Cyber Cat",
    category: "cyber",
    emoji: "🐱",
    bgColor: "from-cyan-500 to-blue-600",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=cyber_cat&backgroundColor=80deea",
  },
  {
    id: "cosmic_astro",
    name: "Cosmic Astronaut",
    category: "cyber",
    emoji: "🧑‍🚀",
    bgColor: "from-blue-600 to-indigo-800",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=cosmic_astro&backgroundColor=90caf9",
  },
  {
    id: "robo_buddy",
    name: "Robo Companion",
    category: "cyber",
    emoji: "🤖",
    bgColor: "from-cyan-600 to-teal-600",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=robo_buddy&backgroundColor=4dd0e1",
  },
  {
    id: "golden_lion",
    name: "Golden Lion",
    category: "animals",
    emoji: "🦁",
    bgColor: "from-yellow-500 to-amber-600",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=golden_lion&backgroundColor=ffe082",
  },
  {
    id: "magic_penguin",
    name: "Magic Penguin",
    category: "animals",
    emoji: "🐧",
    bgColor: "from-sky-500 to-blue-700",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=magic_penguin&backgroundColor=81d4fa",
  },
  {
    id: "neon_dragon",
    name: "Neon Dragon",
    category: "fantasy",
    emoji: "🐲",
    bgColor: "from-purple-600 to-pink-600",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=neon_dragon&backgroundColor=ce93d8",
  },
  {
    id: "star_bunny",
    name: "Star Bunny",
    category: "animals",
    emoji: "🐰",
    bgColor: "from-pink-500 to-rose-600",
    svgPath: "https://api.dicebear.com/7.x/bottts/svg?seed=star_bunny&backgroundColor=f48fb1",
  },
];

export function getAvatarById(id?: string | null): CharacterAvatar {
  if (!id) return CHARACTER_AVATARS[0];
  const found = CHARACTER_AVATARS.find((a) => a.id === id || a.name.toLowerCase() === id.toLowerCase() || a.svgPath === id);
  return found || CHARACTER_AVATARS[0];
}

export function getDefaultAvatarForUser(usernameOrEmail?: string): CharacterAvatar {
  if (!usernameOrEmail) return CHARACTER_AVATARS[0];
  let hash = 0;
  for (let i = 0; i < usernameOrEmail.length; i++) {
    hash = (hash << 5) - hash + usernameOrEmail.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CHARACTER_AVATARS.length;
  return CHARACTER_AVATARS[index];
}
