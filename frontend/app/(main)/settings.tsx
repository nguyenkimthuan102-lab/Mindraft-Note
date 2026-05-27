import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import {
  Palette, Bell, User, Cloud, Info, Clock, Calendar,
  Menu as MenuIcon, CheckCircle2, ChevronRight, ChevronLeft,
} from 'lucide-react-native';

// ─── Bảng màu ─────────────────────────────────────────────────────────────────

const lightColors = {
  bg: '#ffffff',
  sidebarBorder: '#f3f4f6',
  textMain: '#111827',
  textSub: '#6b7280',
  activeTabBg: '#f0fdf4',
  activeTabIconBg: '#166534',
  inactiveTabIconBg: '#f3f4f6',
  activeText: '#166534',
  segmentBg: '#f9fafb',
  segmentActiveBg: '#000000',
  segmentActiveText: '#ffffff',
  segmentInactiveText: '#374151',
  cardBorder: '#e5e7eb',
  cardActiveBorder: '#166534',
  cardActiveBg: '#f0fdf4',
  cardBg: '#ffffff',
};

const darkColors = {
  bg: '#111827',
  sidebarBorder: '#374151',
  textMain: '#f9fafb',
  textSub: '#9ca3af',
  activeTabBg: '#064e3b',
  activeTabIconBg: '#10b981',
  inactiveTabIconBg: '#374151',
  activeText: '#34d399',
  segmentBg: '#1f2937',
  segmentActiveBg: '#ffffff',
  segmentActiveText: '#000000',
  segmentInactiveText: '#d1d5db',
  cardBorder: '#374151',
  cardActiveBorder: '#10b981',
  cardActiveBg: '#064e3b',
  cardBg: '#1f2937',
};

const TAB_LIST = [
  { id: 'appearance',    label: 'Giao diện',        sub: 'Tùy chỉnh giao diện và chế độ', Icon: Palette },
  { id: 'notifications', label: 'Thông báo',         sub: 'Quản lý thông báo',              Icon: Bell    },
  { id: 'account',       label: 'Tài khoản',         sub: 'Thông tin cá nhân',              Icon: User    },
  { id: 'data',          label: 'Dữ liệu & đồng bộ', sub: 'Sao lưu dữ liệu',               Icon: Cloud   },
  { id: 'about',         label: 'Giới thiệu',        sub: 'Về Mindraft',                    Icon: Info    },
];

// ─── Component chính ──────────────────────────────────────────────────────────

export default function SettingsScreen() {
  // null = mobile đang ở màn danh sách tab
  const [activeTab, setActiveTab] = useState<string | null>('appearance');

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 720;

  const {
    isLoaded,
    theme,
    viewMode,
    sort,
    notifications,
    updateTheme,
    updateViewMode,
    updateSort,
    toggleNotification,
  } = useSettingsStore();

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const currentTabMeta = TAB_LIST.find(t => t.id === activeTab);

  // ── Nội dung từng tab ────────────────────────────────────────────────────────

  const renderTabContent = () => {
    if (!isLoaded) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
          <ActivityIndicator size="large" color={colors.activeTabIconBg} />
          <Text style={{ color: colors.textSub, marginTop: 12 }}>Đang tải cài đặt...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'account':
      case 'data':
      case 'about':
        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
            <Text style={{ color: colors.textSub, fontSize: 16 }}>Chức năng đang được phát triển</Text>
          </View>
        );

      case 'appearance':
        return (
          <View>
            {!isMobile && (
              <>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.textMain }}>Giao diện</Text>
                <Text style={{ color: colors.textSub, marginBottom: 40 }}>Tùy chỉnh Mindraft</Text>
              </>
            )}

            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textMain, marginBottom: 12 }}>
              Chế độ giao diện
            </Text>
            <View style={{ flexDirection: 'row', backgroundColor: colors.segmentBg, borderRadius: 10, padding: 4, marginBottom: 32 }}>
              <SegmentedBtn label="Sáng"     active={theme === 'light'}  onPress={() => updateTheme('light')}  colors={colors} />
              <SegmentedBtn label="Tối"      active={theme === 'dark'}   onPress={() => updateTheme('dark')}   colors={colors} />
              <SegmentedBtn label="Hệ thống" active={theme === 'system'} onPress={() => updateTheme('system')} colors={colors} />
            </View>

            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textMain, marginBottom: 12 }}>
              Chế độ xem mặc định
            </Text>
            <View style={{ flexDirection: 'row', backgroundColor: colors.segmentBg, borderRadius: 10, padding: 4, marginBottom: 32 }}>
              <SegmentedBtn label="Lưới"      active={viewMode === 'grid'} onPress={() => updateViewMode('grid')} colors={colors} />
              <SegmentedBtn label="Danh sách" active={viewMode === 'list'} onPress={() => updateViewMode('list')} colors={colors} />
            </View>

            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textMain, marginBottom: 12 }}>
              Sắp xếp theo
            </Text>
            <SortOptionCard
              label="Cập nhật lần cuối"
              sub="Ghi chú mới sửa hiện lên đầu"
              Icon={Clock}
              active={sort.field === 'updated_at'}
              onPress={() => updateSort({ field: 'updated_at', direction: 'desc' })}
              colors={colors}
            />
            <SortOptionCard
              label="Ngày tạo"
              sub="Ghi chú mới tạo hiện lên đầu"
              Icon={Calendar}
              active={sort.field === 'created_at'}
              onPress={() => updateSort({ field: 'created_at', direction: 'desc' })}
              colors={colors}
            />
            <SortOptionCard
              label="Tùy chỉnh"
              sub="Kéo thả để sắp xếp thủ công"
              Icon={MenuIcon}
              active={sort.field === 'custom'}
              onPress={() => updateSort({ field: 'custom', direction: 'desc' })}
              colors={colors}
            />
          </View>
        );

      case 'notifications':
        return (
          <View>
            {!isMobile && (
              <>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.textMain }}>Thông báo</Text>
                <Text style={{ color: colors.textSub, marginBottom: 40 }}>Quản lý cách bạn nhận thông báo</Text>
              </>
            )}
            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textMain, marginBottom: 20 }}>
              Thông báo ứng dụng
            </Text>
            <NotificationRow
              label="Thông báo nhắc nhở"
              value={notifications.reminders}
              onToggle={() => toggleNotification('reminders')}
              colors={colors}
            />
            <NotificationRow
              label="Thông báo cộng tác"
              value={notifications.collaboration}
              onToggle={() => toggleNotification('collaboration')}
              colors={colors}
            />
          </View>
        );

      default:
        return null;
    }
  };

  // ── MOBILE LAYOUT ────────────────────────────────────────────────────────────

  if (isMobile) {
    // Màn danh sách
    if (activeTab === null) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <ScrollView
            contentContainerStyle={{
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 24,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.textMain, marginBottom: 4 }}>
              Cài đặt
            </Text>
            <Text style={{ color: colors.textSub, marginBottom: 24 }}>
              Tùy chỉnh trải nghiệm của bạn
            </Text>

            {TAB_LIST.map(({ id, label, sub, Icon }) => (
              <MobileTabItem
                key={id}
                id={id}
                label={label}
                sub={sub}
                Icon={Icon}
                onPress={setActiveTab}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
      );
    }

    // Màn nội dung tab
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.sidebarBorder,
          backgroundColor: colors.bg,
        }}>
          <TouchableOpacity
            onPress={() => setActiveTab(null)}
            style={{ padding: 8, marginRight: 4 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textMain }}>
            {currentTabMeta?.label ?? 'Cài đặt'}
          </Text>
        </View>

        {/* Nội dung */}
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 32,
          }}
        >
          {renderTabContent()}
        </ScrollView>
      </View>
    );
  }

  // ── DESKTOP LAYOUT ───────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {/* Sidebar */}
      <View style={{ width: 320, borderRightWidth: 1, borderColor: colors.sidebarBorder, padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.textMain }}>Cài đặt</Text>
        <Text style={{ color: colors.textSub, marginBottom: 32 }}>Tùy chỉnh trải nghiệm của bạn</Text>

        {TAB_LIST.map(({ id, label, sub, Icon }) => (
          <SidebarTab
            key={id}
            id={id}
            label={label}
            sub={sub}
            Icon={Icon}
            currentTab={activeTab ?? ''}
            setTab={setActiveTab}
            colors={colors}
          />
        ))}
      </View>

      {/* Nội dung */}
      <ScrollView contentContainerStyle={{ padding: 48, flexGrow: 1 }}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SidebarTab = ({ id, label, sub, Icon, currentTab, setTab, colors }: any) => {
  const active = currentTab === id;
  return (
    <TouchableOpacity
      onPress={() => setTab(id)}
      style={{
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        backgroundColor: active ? colors.activeTabBg : 'transparent',
        marginBottom: 8,
        alignItems: 'center',
      }}
    >
      <View style={{
        padding: 10,
        borderRadius: 50,
        backgroundColor: active ? colors.activeTabIconBg : colors.inactiveTabIconBg,
        marginRight: 16,
      }}>
        <Icon size={20} color={active ? '#fff' : colors.textSub} />
      </View>
      <View>
        <Text style={{ fontWeight: '600', fontSize: 15, color: active ? colors.activeText : colors.textMain }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSub }}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
};

const MobileTabItem = ({ id, label, sub, Icon, onPress, colors }: any) => (
  <TouchableOpacity
    onPress={() => onPress(id)}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 10,
    }}
  >
    <View style={{
      padding: 10,
      borderRadius: 50,
      backgroundColor: colors.inactiveTabIconBg,
      marginRight: 14,
    }}>
      <Icon size={20} color={colors.textSub} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontWeight: '600', fontSize: 15, color: colors.textMain }}>{label}</Text>
      <Text style={{ fontSize: 12, color: colors.textSub }}>{sub}</Text>
    </View>
    <ChevronRight size={18} color={colors.textSub} />
  </TouchableOpacity>
);

const SegmentedBtn = ({ label, active, onPress, colors }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: active ? colors.segmentActiveBg : 'transparent',
    }}
  >
    <Text style={{ fontWeight: '600', color: active ? colors.segmentActiveText : colors.segmentInactiveText }}>
      {label}
    </Text>
  </TouchableOpacity>
);

const SortOptionCard = ({ label, sub, Icon, active, onPress, colors }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
      borderColor: active ? colors.cardActiveBorder : colors.cardBorder,
      backgroundColor: active ? colors.cardActiveBg : colors.cardBg,
    }}
  >
    <View style={{ marginRight: 16 }}>
      <Icon size={24} color={active ? colors.activeText : colors.textSub} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontWeight: '600', fontSize: 16, color: active ? colors.activeText : colors.textMain }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSub }}>{sub}</Text>
    </View>
    {active && <CheckCircle2 size={20} color={colors.activeText} />}
  </TouchableOpacity>
);

const NotificationRow = ({ label, value, onToggle, colors }: any) => (
  <View style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.sidebarBorder,
  }}>
    <Text style={{ fontSize: 16, color: colors.textMain }}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ true: colors.activeTabIconBg, false: colors.sidebarBorder }}
      thumbColor="#fff"
    />
  </View>
);