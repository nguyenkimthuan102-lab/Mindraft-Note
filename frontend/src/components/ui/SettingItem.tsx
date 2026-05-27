import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

export const SortOptionCard = ({ label, sub, Icon, active, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.8}
    style={{ 
      flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, 
      borderWidth: 1, marginBottom: 12,
      borderColor: active ? '#166534' : '#e5e7eb',
      backgroundColor: active ? '#f0fdf4' : '#fff',
    }}
  >
    <View style={{ marginRight: 16 }}>
      <Icon size={24} color={active ? '#166534' : '#374151'} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontWeight: '600', fontSize: 16, color: active ? '#166534' : '#111827' }}>{label}</Text>
      <Text style={{ fontSize: 13, color: '#6b7280' }}>{sub}</Text>
    </View>
    {active && <CheckCircle2 size={20} color="#166534" />}
  </TouchableOpacity>
);