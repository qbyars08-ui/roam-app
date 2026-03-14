// =============================================================================
// ROAM — PhotoBackground with shimmer loader + error fallback
// Never black. Never broken. Always a real photo.
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  ImageBackground,
  View,
  StyleSheet,
  type ImageBackgroundProps,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import { getDestinationPhoto, BACKUP_FALLBACK } from '../../lib/photos';
import ShimmerOverlay from './ShimmerOverlay';

interface PhotoBackgroundProps extends Omit<ImageBackgroundProps, 'source'> {
  /** Destination name — uses getDestinationPhoto() */
  destination?: string;
  /** Direct URI — used when destination not provided */
  uri?: string;
  /** Style for the container */
  style?: ViewStyle;
  /** Style for the image */
  imageStyle?: ImageStyle;
  /** Show skeleton while loading */
  showSkeleton?: boolean;
}

export default function PhotoBackground({
  destination,
  uri,
  style,
  imageStyle,
  showSkeleton = true,
  resizeMode = 'cover',
  ...props
}: PhotoBackgroundProps) {
  const resolvedUri = destination ? getDestinationPhoto(destination) : uri;
  const [currentUri, setCurrentUri] = useState(resolvedUri ?? BACKUP_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync derived state
    setCurrentUri(resolvedUri ?? BACKUP_FALLBACK);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync derived state
    setLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync derived state
    setFailed(false);
  }, [resolvedUri]);

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    if (!failed) {
      setFailed(true);
      setCurrentUri(BACKUP_FALLBACK);
      setLoading(true);
    } else {
      setLoading(false);
    }
  };

  const displayUri = currentUri ?? BACKUP_FALLBACK;

  return (
    <View style={[styles.wrapper, style]}>
      {showSkeleton && <ShimmerOverlay visible={loading} />}
      <ImageBackground
        source={{ uri: displayUri }}
        style={[styles.image, style]}
        imageStyle={[styles.imageInner, imageStyle]}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden' },
  image: { flex: 1 },
  imageInner: {},
});
