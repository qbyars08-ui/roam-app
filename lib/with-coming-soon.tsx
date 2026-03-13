// =============================================================================
// ROAM — withComingSoon HOC
// Wraps a screen component to show "Coming Soon" on native v1.0 builds.
// Web stays full-featured. Pass-through when feature is enabled.
// =============================================================================
import React from 'react';
import { isComingSoon } from './feature-flags';
import ComingSoon from '../components/ComingSoon';

interface GateConfig {
  /** Route name used to check feature flag */
  routeName: string;
  /** Display name for the Coming Soon screen */
  title: string;
  /** Optional description */
  description?: string;
}

/**
 * HOC that gates a screen behind "Coming Soon" on native v1.0 builds.
 * On web, always renders the real component.
 *
 * Usage:
 *   export default withComingSoon(MyScreen, {
 *     routeName: 'my-screen',
 *     title: 'My Feature',
 *   });
 */
export function withComingSoon<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: GateConfig
): React.FC<P> {
  const GatedComponent: React.FC<P> = (props) => {
    if (isComingSoon(config.routeName)) {
      return (
        <ComingSoon
          title={config.title}
          description={config.description}
        />
      );
    }
    return <WrappedComponent {...props} />;
  };

  GatedComponent.displayName = `ComingSoon(${config.routeName})`;
  return GatedComponent;
}
