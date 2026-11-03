"use client";

import { useState } from "react";

type UserAvatarProps = {
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "lg";
  decorative?: boolean;
};

const sizeClass = {
  sm: "h-9 w-9 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

export function UserAvatar({
  name,
  avatarUrl,
  size = "sm",
  decorative = false,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const showImage = Boolean(avatarUrl) && !failed;

  if (showImage) {
    return (
      // Google and GitHub avatar hosts are not fixed, so this stays a plain image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl ?? undefined}
        alt={decorative ? "" : name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${sizeClass[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden={decorative}
      className={`${sizeClass[size]} inline-flex items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200`}
    >
      {initial}
    </span>
  );
}
