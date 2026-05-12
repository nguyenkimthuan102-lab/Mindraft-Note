import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useAppStore } from '../../src/store/useAppStore'; 
import { useSettingsStore } from '../../src/store/useSettingsStore'; 
import { Palette, Bell, User, Cloud, Info, Clock, Calendar, Menu as MenuIcon, CheckCircle2 } from 'lucide-react-native';

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

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState('appearance');
  const { theme, setTheme, viewMode, setViewMode, sort, setSort } = useAppStore();
  const { notifications, toggleNotification } = useSettingsStore();
  
  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // HÀM RENDER NỘI DUNG: Cách này giúp tránh lỗi Text string trong React Native
  const renderTabContent = () => {
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
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.textMain }}>Giao diện</Text>
            <Text style={{ color: colors.textSub, marginBottom: 40 }}>Tùy chỉnh Mindraft</Text>

            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textMain, marginBottom: 12 }}>Chế độ giao diện</Text>
            <View style={{ flexDirection: 'row', backgroundColor: colors.segmentBg, borderRadius: 10, padding: 4, marginBottom: 32 }}>
              <SegmentedBtn label="Sáng" active={theme === 'light'} onPress={() => setTheme('light')} colors={colors} />
              <SegmentedBtn label="Tối" active={theme === 'dark'} onPress={() => setTheme('dark')} colors={colors} />
              <SegmentedBtn label="Hệ thống" active={theme === 'system'} onPress={() => setTheme('system')} colors={colors} />
            </View>

            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textMain, marginBottom: 12 }}>Chế độ xem mặc định</Text>
            <View style={{ flexDirection: 'row', backgroundColor: colors.segmentBg, borderRadius: 10, padding: 4, marginBottom: 32 }}>
              <SegmentedBtn label="Lưới" active={viewMode === 'grid'} onPress={() => setViewMode('grid')} colors={colors} />
              <SegmentedBtn label="Danh sách" active={viewMode === 'list'} onPress={() => setViewMode('list')} colors={colors} />
            </View>

            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textMain, marginBottom: 12 }}>Sắp xếp theo</Text>
            <SortOptionCard label="Cập nhật lần cuối" sub="Ghi chú mới sửa hiện lên đầu" Icon={Clock} active={sort.field === 'updated_at'} onPress={() => setSort({ field: 'updated_at', direction: 'desc' })} colors={colors} />
            <SortOptionCard label="Ngày tạo" sub="Ghi chú mới tạo hiện lên đầu" Icon={Calendar} active={sort.field === 'created_at'} onPress={() => setSort({ field: 'created_at', direction: 'desc' })} colors={colors} />
            <SortOptionCard label="Tùy chỉnh" sub="Kéo thả để sắp xếp thủ công" Icon={MenuIcon} active={sort.field === 'custom'} onPress={() => setSort({ field: 'custom', direction: 'desc' })} colors={colors} />
          </View>
        );

      case 'notifications':
        return (
          <View>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.textMain }}>Thông báo</Text>
            <Text style={{ color: colors.textSub, marginBottom: 40 }}>Quản lý cách bạn nhận thông báo</Text>

            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textMain, marginBottom: 20 }}>Thông báo ứng dụng</Text>
            <NotificationRow label="Thông báo nhắc nhở" value={notifications.reminders} onToggle={() => toggleNotification('reminders')} colors={colors} />
            <NotificationRow label="Thông báo cộng tác" value={notifications.collaboration} onToggle={() => toggleNotification('collaboration')} colors={colors} />
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {/* SIDEBAR CÀI ĐẶT */}
      <View style={{ width: 320, borderRightWidth: 1, borderColor: colors.sidebarBorder, padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.textMain }}>Cài đặt</Text>
        <Text style={{ color: colors.textSub, marginBottom: 32 }}>Tùy chỉnh trải nghiệm của bạn</Text>
        
        <SidebarTab id="appearance" label="Giao diện" sub="Tùy chỉnh giao diện và chế độ" Icon={Palette} currentTab={activeTab} setTab={setActiveTab} colors={colors} />
        <SidebarTab id="notifications" label="Thông báo" sub="Quản lý thông báo" Icon={Bell} currentTab={activeTab} setTab={setActiveTab} colors={colors} />
        <SidebarTab id="account" label="Tài khoản" sub="Thông tin cá nhân" Icon={User} currentTab={activeTab} setTab={setActiveTab} colors={colors} />
        <SidebarTab id="data" label="Dữ liệu & đồng bộ" sub="Sao lưu dữ liệu" Icon={Cloud} currentTab={activeTab} setTab={setActiveTab} colors={colors} />
        <SidebarTab id="about" label="Giới thiệu" sub="Về Mindraft" Icon={Info} currentTab={activeTab} setTab={setActiveTab} colors={colors} />
      </View>

      {/* NỘI DUNG CHI TIẾT - CHỈ GỌI 1 HÀM DUY NHẤT */}
      <ScrollView contentContainerStyle={{ padding: 48, flex: 1 }}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

// --- SUB-COMPONENTS ---

const SidebarTab = ({ id, label, sub, Icon, currentTab, setTab, colors }: any) => {
  const active = currentTab === id;
  return (
    <TouchableOpacity onPress={() => setTab(id)} style={{ flexDirection: 'row', padding: 12, borderRadius: 12, backgroundColor: active ? colors.activeTabBg : 'transparent', marginBottom: 8, alignItems: 'center' }}>
      <View style={{ padding: 10, borderRadius: 50, backgroundColor: active ? colors.activeTabIconBg : colors.inactiveTabIconBg, marginRight: 16 }}>
        <Icon size={20} color={active ? '#fff' : colors.textSub} />
      </View>
      <View>
        <Text style={{ fontWeight: '600', fontSize: 15, color: active ? colors.activeText : colors.textMain }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.textSub }}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
};

const SegmentedBtn = ({ label, active, onPress, colors }: any) => (
  <TouchableOpacity onPress={onPress} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: active ? colors.segmentActiveBg : 'transparent' }}>
    <Text style={{ fontWeight: '600', color: active ? colors.segmentActiveText : colors.segmentInactiveText }}>{label}</Text>
  </TouchableOpacity>
);

const SortOptionCard = ({ label, sub, Icon, active, onPress, colors }: any) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, borderColor: active ? colors.cardActiveBorder : colors.cardBorder, backgroundColor: active ? colors.cardActiveBg : colors.cardBg }}>
    <View style={{ marginRight: 16 }}>
      <Icon size={24} color={active ? colors.activeText : colors.textSub} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontWeight: '600', fontSize: 16, color: active ? colors.activeText : colors.textMain }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.textSub }}>{sub}</Text>
    </View>
    {active && <CheckCircle2 size={20} color={colors.activeText} />}
  </TouchableOpacity>
);

const NotificationRow = ({ label, value, onToggle, colors }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.sidebarBorder }}>
    <Text style={{ fontSize: 16, color: colors.textMain }}>{label}</Text>
    <Switch value={value} onValueChange={onToggle} trackColor={{ true: colors.activeTabIconBg, false: colors.sidebarBorder }} thumbColor="#fff" />
  </View>
);