import { Slot } from 'expo-router';

// Root Layout KHÔNG ĐƯỢC chứa Sidebar hay bất kỳ UI nào
// Nó chỉ để Slot để các Layout con tự quyết định giao diện
export default function RootLayout() {
  return <Slot />;
}