// =============================================================================
// ROAM — Image with auto-fallback on load failure
// =============================================================================

import React, { useState } from 'react';
import { Image, type ImageProps } from 'react-native';

import { BACKUP_FALLBACK } from '../../lib/photos';

export default function ResilientImage({
  source,
  onError,
  ...props
}: ImageProps) {
  const [failed, setFailed] = useState(false);

  const uri =
    failed
      ? BACKUP_FALLBACK
      : typeof source === 'object' && source && 'uri' in source
        ? (source as { uri: string }).uri
        : undefined;

  const handleError = () => {
    if (!failed) setFailed(true);
    onError?.({ nativeEvent: { error: 'Load failed' } } as any);
  };

  const imageSource = uri ? { uri } : source;
  if (!imageSource) return null;

  return <Image {...props} source={imageSource} onError={handleError} />;
}
