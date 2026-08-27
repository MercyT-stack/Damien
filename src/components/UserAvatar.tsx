import React from "react";
import { getAvatarById, getDefaultAvatarForUser } from "../config/avatars";

interface UserAvatarProps {
  avatarId?: string | null;
  usernameOrEmail?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarId,
  usernameOrEmail,
  size = "md",
  className = "",
}) => {
  const avatar = avatarId
    ? getAvatarById(avatarId)
    : getDefaultAvatarForUser(usernameOrEmail || "mercy");

  const sizeClasses = {
    xs: "w-5 h-5 text-[11px]",
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-16 h-16 text-2xl",
  };

  const isFullRounded = className.includes("rounded-") ? "" : "rounded-full";

  return (
    <div
      id="user-avatar-badge"
      className={`relative flex items-center justify-center shrink-0 select-none overflow-hidden bg-gradient-to-br ${avatar.bgColor} ${sizeClasses[size]} ${isFullRounded} ${className}`}
      title={avatar.name}
    >
      <span className="transform transition-transform duration-200" role="img" aria-label={avatar.name}>
        {avatar.emoji}
      </span>
    </div>
  );
};
