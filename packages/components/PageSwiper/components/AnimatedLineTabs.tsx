import React, { useLayoutEffect, useRef } from 'react';
import type {
  ScrollViewProps,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import {
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Pressable,
  View,
  ScrollView,
} from 'react-native';
import useDynamicItemLayout from '../../../hooks/useDynamicItemLayout';
import { usePageSwiperContext } from '../context';
import type { Page } from './PageFlatList';

interface AnimatedLineTabsProps<T> extends ScrollViewProps {
  pages: T[];
  activeIndex?: number;
  contentContainerStyle?: ViewStyle;
  onPress?: (index: number) => void;
  viewOffset?: number;
  lineThickness?: number;
  lineColor?: string;
  topInset?: number;
  textStyle?: StyleProp<TextStyle>;
  tabStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  renderTab?: (label: string, index: number) => React.ReactElement;
  scrollPageConfig?: { animated?: boolean; scrollOnPress?: boolean };
}

function AnimatedLineTabs<T extends Page>({
  pages,
  renderTab,
  contentContainerStyle,
  lineThickness = 4,
  onPress,
  activeIndex,
  viewOffset = 24,
  scrollPageConfig,
  topInset,
  textStyle,
  backgroundColor = '#ffffff',
  lineColor = '#000000',
  inactiveTextColor = '#888888',
  activeTextColor = '#000000',
  tabStyle,
  ...props
}: AnimatedLineTabsProps<T>) {
  const labels = pages.map((page) => page.label);

  const { width } = useWindowDimensions();

  const ref = useRef<ScrollView>(null);

  const { scrollX, flatListRef } = usePageSwiperContext();

  const {
    layout,
    handleLayout,
    doneReLayout,
    initialScrollDone,
    getOffsetOfIndex,
  } = useDynamicItemLayout({
    data: pages,
    horizontal: true,
  });

  const offsetLeft =
    Number(contentContainerStyle?.paddingLeft) ||
    Number(contentContainerStyle?.paddingHorizontal) ||
    Number(contentContainerStyle?.padding) ||
    0;

  useLayoutEffect(() => {
    if (!doneReLayout || typeof activeIndex !== 'number') return;

    const offset =
      getOffsetOfIndex({ layout, index: activeIndex, gap: 0 }) - viewOffset;

    if (initialScrollDone.current) {
      ref.current?.scrollTo({ y: 0, x: offset });
    } else {
      initialScrollDone.current = true;
      ref.current?.scrollTo({ y: 0, x: offset, animated: false });
    }
  }, [activeIndex, doneReLayout, viewOffset]);

  return (
    <View>
      {!!topInset && (
        <Animated.View
          style={{
            width: '100%',
            height: topInset,
            backgroundColor,
          }}
        />
      )}
      <ScrollView
        bounces={false}
        {...props}
        horizontal
        ref={ref}
        style={StyleSheet.flatten([props.style, { width, backgroundColor }])}
        contentContainerStyle={contentContainerStyle}
        showsHorizontalScrollIndicator={false}>
        {labels.map((label, index) => {
          const key = `${label}-${index}`;

          return (
            <Pressable
              onPress={() => {
                onPress && onPress(index);
                if (scrollPageConfig?.animated === false) return;
                flatListRef.current?.scrollToIndex({
                  index,
                  animated: scrollPageConfig?.animated,
                });
              }}
              disabled={scrollPageConfig?.scrollOnPress === false}
              onLayout={(e) => handleLayout(e, index)}
              key={key}
              testID={`tab-${index}`}
              style={StyleSheet.flatten([styles.container, tabStyle])}>
              {renderTab ? (
                renderTab(label, index)
              ) : (
                <View>
                  <Text style={[textStyle, { color: inactiveTextColor }]}>
                    {label}
                  </Text>
                  <Animated.Text
                    style={[
                      textStyle,
                      {
                        color: activeTextColor,
                        position: 'absolute',
                        opacity: scrollX.interpolate({
                          inputRange: [
                            width * (index - 1),
                            width * index,
                            width * (index + 1),
                          ],
                          outputRange: [0, 1, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}>
                    {label}
                  </Animated.Text>
                </View>
              )}
            </Pressable>
          );
        })}

        {doneReLayout && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                width: 1,
                height: lineThickness,
                bottom: 0,
                backgroundColor: lineColor,
              },
              {
                transform: [
                  {
                    translateX: scrollX.interpolate({
                      inputRange: pages.map((_, index) => index * width),
                      outputRange: pages.map((_, index) => {
                        const width = layout.get(index);
                        if (!width) return 0;
                        return (
                          getOffsetOfIndex({ layout, index, gap: 0 }) +
                          width / 2 +
                          offsetLeft
                        );
                      }),
                    }),
                  },
                  {
                    scaleX: scrollX.interpolate({
                      inputRange: pages.map((_, index) => index * width),
                      outputRange: pages.map((_, index) => {
                        const width = layout.get(index);
                        if (!width) return 1;
                        return width;
                      }),
                    }),
                  },
                ],
              },
            ]}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});

export default AnimatedLineTabs;
