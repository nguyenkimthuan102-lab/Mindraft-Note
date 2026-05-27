import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useSyncStore } from '@/src/store/useSyncStore';

type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';

interface SyncIndicatorProps {
    status: SyncStatus;
}

export function SyncIndicator({ status }: SyncIndicatorProps) {
    const rotation = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const spinAnim = useRef<Animated.CompositeAnimation | null>(null);
    const spin = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    useEffect(() => {
        if (status === 'syncing') {
            opacity.setValue(1);
            spinAnim.current = Animated.loop(
                Animated.timing(rotation, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                })
            );
            spinAnim.current.start();
        } else {
            spinAnim.current?.stop();
            rotation.setValue(0);

            if (status === 'done') {
                // Sau 1.5s tự về idle thay vì fade out
                const timeout = setTimeout(() => {
                    useSyncStore.getState().setIdle(); // ← cần thêm setIdle vào store
                }, 1500);
                return () => clearTimeout(timeout);
            }
        }
    }, [status]);

    const iconColor =
        status === 'error' ? colors.danger :
            status === 'done' ? colors.primary :
                status === 'syncing' ? colors.primary :
                    colors.textTertiary;

    const iconName =
        status === 'error' ? 'cloud-off' :
            status === 'syncing' ? 'refresh-cw' :
                'cloud'; // idle + done đều hiện cloud

    return (
        <View>
            <TouchableOpacity style={styles.btn} activeOpacity={0.7}>
                <Animated.View
                    style={status === 'syncing' ? { transform: [{ rotate: spin }] } : undefined}
                >
                    <Feather name={iconName} size={18} color={iconColor} />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    btn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});