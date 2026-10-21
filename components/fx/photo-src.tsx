"use client";

import { useState } from "react";

/**
 * Ảnh thật nằm trong thư mục `photos/` (KHÔNG phải /public) nên không ai tải được
 * nếu chưa mở khóa. Route /api/photo/<id> kiểm tra cookie rồi mới trả ảnh.
 * Nếu không có file thật (hoặc bị chặn), tự rơi về ảnh mẫu.
 */
export function usePhotoSrc(id: string, fallback: string) {
  const [useFallback, setUseFallback] = useState(false);
  return {
    src: useFallback ? fallback : `/api/photo/${id}`,
    onError: () => setUseFallback(true)
  };
}

export function PhotoImage({
  id,
  fallback,
  alt,
  className,
  priority,
  onClick
}: {
  id: string;
  fallback: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
}) {
  const { src, onError } = usePhotoSrc(id, fallback);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={onError}
      onClick={onClick}
    />
  );
}
