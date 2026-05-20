import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonCard({ height = 80, borderRadius = 12, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[s.box, { height, borderRadius, opacity }, style]} />;
}

const s = StyleSheet.create({
  box: { backgroundColor: '#e5e7eb' },
});
