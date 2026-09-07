import React, { useState, useEffect } from 'react';

export interface SecureImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  filename?: string | null;
  fallbackIcon?: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SecureImage = ({
  src,
  filename,
  alt = '',
  className = '',
  fallbackIcon,
  fallback,
  ...props
}: SecureImageProps) => {
  const effectiveSrc = filename || src;
  const effectiveFallback = fallback || fallbackIcon;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(effectiveSrc));
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!effectiveSrc) {
      setObjectUrl(null);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;

    setIsLoading(true);
    setHasError(false);

    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL || '';
        
        // Se a url for apenas o nome do arquivo (ex: "uuid.jpg"), prefixar com /api/imagens/
        let resolvedUrl = effectiveSrc;
        if (!resolvedUrl.startsWith('http') && !resolvedUrl.startsWith('/api/imagens/')) {
          resolvedUrl = `/api/imagens/${resolvedUrl.replace(/^\//, '')}`;
        }

        const fullUrl = resolvedUrl.startsWith('http')
          ? resolvedUrl
          : `${baseUrl}${resolvedUrl.startsWith('/') ? '' : '/'}${resolvedUrl}`;

        const response = await fetch(fullUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        if (!isMounted) return;

        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      } catch (err) {
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchImage();

    // Cleanup: revoke URL para evitar vazamento de memória
    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [effectiveSrc]);

  if (!effectiveSrc || hasError) {
    return effectiveFallback ? (
      <>{effectiveFallback}</>
    ) : (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-400 text-xs ${className}`}>
        Sem foto
      </div>
    );
  }

  if (isLoading) {
    return <div className={`animate-pulse bg-gray-200 ${className}`} />;
  }

  return (
    <img
      src={objectUrl || ''}
      alt={alt}
      className={className}
      {...props}
    />
  );
};
