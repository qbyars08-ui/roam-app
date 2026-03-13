// =============================================================================
// ROAM — Stub for @expo/vector-icons (web only, via metro resolver)
// Prevents ~2.5MB icon fonts from bundling. App uses Lucide exclusively.
// =============================================================================
import React from 'react';
import { View } from 'react-native';

const StubIcon = () => <View style={{ width: 24, height: 24 }} />;

// Named exports used by react-navigation, expo-router, etc.
export const Ionicons = StubIcon;
export const MaterialIcons = StubIcon;
export const MaterialCommunityIcons = StubIcon;
export const FontAwesome = StubIcon;
export const FontAwesome5 = StubIcon;
export const FontAwesome6 = StubIcon;
export const Feather = StubIcon;
export const AntDesign = StubIcon;
export const Entypo = StubIcon;
export const EvilIcons = StubIcon;
export const Fontisto = StubIcon;
export const Foundation = StubIcon;
export const Octicons = StubIcon;
export const SimpleLineIcons = StubIcon;
export const Zocial = StubIcon;

export const createIconSet = () => StubIcon;
export const createMultiStyleIconSet = () => StubIcon;
export const createIconSetFromFontello = () => StubIcon;
export const createIconSetFromIcoMoon = () => StubIcon;

export default StubIcon;
