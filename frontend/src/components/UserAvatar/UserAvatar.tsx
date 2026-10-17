import React, { useState, useEffect } from "react";
import styles from "./UserAvatar.module.css";

export interface UserAvatarProps {
  name?: string | null;
  fotoUrl?: string | null;
  fallbackText?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  fotoUrl,
  fallbackText,
  size = "sm",
  className,
  style,
  title,
  onClick,
  role,
  tabIndex,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [fotoUrl]);

  const initial =
    fallbackText ||
    (name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : "?");

  const sizeClass = {
    xs: styles.sizeXs,
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
    xl: styles.sizeXl,
  }[size];

  return (
    <div
      className={`${styles.avatarWrapper} ${sizeClass} ${className || ""}`}
      style={style}
      title={title || name || undefined}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
    >
      {fotoUrl && !hasError ? (
        <img
          src={fotoUrl}
          alt={name || "Foto de perfil"}
          className={styles.avatarImg}
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};
