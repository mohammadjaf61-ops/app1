import React, { useEffect, useRef } from 'react';
import type { ViewStyle, ViewProps } from 'react-native';
import { Animated } from 'react-native';

export interface FadeInViewProps extends ViewProps {
  /** Children to animate */
  children: React.ReactNode;
  /** Animation duration in ms */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Slide direction ('up' | 'down' | 'left' | 'right') */
  slide?: 'up' | 'down' | 'left' | 'right';
  /** Slide distance in pixels */
  slideDistance?: number;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * View that fades in with optional slide animation
 *
 * Micro-interaction #2: Screen/Element transition
 *
 * Usage:
 * ```tsx
 * <FadeInView slide="up">
 *   <ProductCard />
 * </FadeInView>
 *
 * // With staggered items
 * {items.map((item, i) => (
 *   <FadeInView key={item.id} delay={i * 50}>
 *     <ListItem item={item} />
 *   </FadeInView>
 * ))}
 * ```
 */
export function FadeInView({
  children,
  duration = 250,
  delay = 0,
  slide,
  slideDistance = 20,
  style,
  ...props
}: FadeInViewProps) {
  const opacityValue = useRef(new Animated.Value(0)).current;
  const translateValue = useRef(
    new Animated.Value(getInitialTranslate(slide, slideDistance)),
  ).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      ...(slide
        ? [
            Animated.timing(translateValue, {
              toValue: 0,
              duration,
              delay,
              useNativeDriver: true,
            }),
          ]
        : []),
    ]);

    animation.start();
  }, [opacityValue, translateValue, duration, delay, slide]);

  const animatedStyle: ViewStyle = {
    opacity: opacityValue as unknown as number,
    ...(slide && getTransformStyle(slide, translateValue)),
  };

  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
}

function getInitialTranslate(slide: FadeInViewProps['slide'], distance: number): number {
  if (!slide) return 0;

  switch (slide) {
    case 'up':
      return distance;
    case 'down':
      return -distance;
    case 'left':
      return distance; // RTL: left means from right
    case 'right':
      return -distance; // RTL: right means from left
    default:
      return 0;
  }
}

function getTransformStyle(
  slide: NonNullable<FadeInViewProps['slide']>,
  translateValue: Animated.Value,
): ViewStyle {
  if (slide === 'up' || slide === 'down') {
    return {
      transform: [{ translateY: translateValue as unknown as number }],
    };
  }
  return {
    transform: [{ translateX: translateValue as unknown as number }],
  };
}

/**
 * Staggered fade-in for lists
 */
export interface StaggeredListProps {
  children: React.ReactNode[];
  /** Delay between each item */
  staggerDelay?: number;
  /** Initial delay before first item */
  initialDelay?: number;
  /** Slide direction for items */
  slide?: FadeInViewProps['slide'];
}

export function StaggeredList({
  children,
  staggerDelay = 50,
  initialDelay = 0,
  slide = 'up',
}: StaggeredListProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <FadeInView
          key={index}
          delay={initialDelay + index * staggerDelay}
          slide={slide}
          slideDistance={15}
        >
          {child}
        </FadeInView>
      ))}
    </>
  );
}
