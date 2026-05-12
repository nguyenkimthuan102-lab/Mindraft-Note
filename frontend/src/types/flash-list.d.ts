declare module "@shopify/flash-list" {
  import { ReactNode, ComponentType, Component } from "react";
  import { FlatListProps, ViewStyle, ScrollViewProps } from "react-native";

  export interface MasonryFlashListProps<T> extends Omit<FlatListProps<T>, "data" | "renderItem"> {
    data: T[];
    numColumns: number;
    renderItem: (info: { item: T; index: number; column: number }) => ReactNode;
    estimatedItemSize: number;
    optimizeItemArrangement?: boolean;
    onEndReached?: () => void;
    onEndReachedThreshold?: number;
    ListHeaderComponent?: ComponentType<any> | ReactNode;
    ListFooterComponent?: ComponentType<any> | ReactNode;
    columnWrapperStyle?: ViewStyle;
    overrideItemLayout?: (layout: { size?: number; index?: number }, item: T) => void;
  }

  export class MasonryFlashList<T> extends Component<MasonryFlashListProps<T>> {}
  export class FlashList<T> extends Component<FlatListProps<T> & { estimatedItemSize: number }> {}
}