import { useState } from 'react';
import {
  Settings as SettingsIcon,
  FileText,
  Bell,
  Archive,
  Trash2,
  Tag,
  User,
  Cloud,
  Info,
  Sun,
  Moon,
  Monitor,
  Grid,
  List
} from 'lucide-react';
import { Switch } from './components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

type SettingSection = 'giao-dien' | 'thong-bao' | null;

export default function App() {
  const [activeSection, setActiveSection] = useState<SettingSection>('giao-dien');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('created');
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [collaborationNotifications, setCollaborationNotifications] = useState(false);

  return (
    <div className="size-full flex bg-white">
      {/* Left Sidebar */}
      <div className="w-[278px] border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-sm" />
            </div>
            <span className="text-xl font-semibold">Mindraft</span>
          </div>

          <button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 font-medium">
            <span className="text-xl">+</span>
            <span>New note</span>
          </button>
        </div>

        <nav className="flex-1 px-3">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <FileText className="w-5 h-5" />
            <span>All notes</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            <span>Reminders</span>
          </button>

          <div className="mt-6 mb-2 px-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Labels</p>
          </div>

          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm rotate-45" />
            </div>
            <span>Personal</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-sm rotate-45" />
            </div>
            <span>Work</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-sm rotate-45" />
            </div>
            <span>Ideas</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Tag className="w-5 h-5" />
            <span>Edit labels</span>
          </button>

          <div className="mt-6">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Archive className="w-5 h-5" />
              <span>Archive</span>
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Trash2 className="w-5 h-5" />
              <span>Trash</span>
            </button>
          </div>
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-green-600 bg-green-50 rounded-lg">
            <SettingsIcon className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Middle Panel - Settings List */}
      <div className="w-[360px] border-r border-gray-200 bg-gray-50 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Cài đặt</h1>
          <p className="text-gray-600 text-sm">Tùy chỉnh trải nghiệm của bạn</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setActiveSection('giao-dien')}
            className={`w-full p-4 rounded-xl text-left transition-colors ${
              activeSection === 'giao-dien'
                ? 'bg-green-50 border border-green-200'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activeSection === 'giao-dien' ? 'bg-green-600' : 'bg-gray-100'
              }`}>
                <SettingsIcon className={`w-5 h-5 ${
                  activeSection === 'giao-dien' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  activeSection === 'giao-dien' ? 'text-green-700' : 'text-gray-900'
                }`}>
                  Giao diện
                </h3>
                <p className="text-sm text-gray-600">Tùy chỉnh giao diện và chế độ</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('thong-bao')}
            className={`w-full p-4 rounded-xl text-left transition-colors ${
              activeSection === 'thong-bao'
                ? 'bg-green-50 border border-green-200'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activeSection === 'thong-bao' ? 'bg-green-600' : 'bg-gray-100'
              }`}>
                <Bell className={`w-5 h-5 ${
                  activeSection === 'thong-bao' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  activeSection === 'thong-bao' ? 'text-green-700' : 'text-gray-900'
                }`}>
                  Thông báo
                </h3>
                <p className="text-sm text-gray-600">Quản lý thông báo và nhắc nhở</p>
              </div>
            </div>
          </button>

          <div className="w-full p-4 rounded-xl bg-white opacity-60 cursor-not-allowed">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Tài khoản</h3>
                <p className="text-sm text-gray-600">Quản lý tài khoản và bảo mật</p>
              </div>
            </div>
          </div>

          <div className="w-full p-4 rounded-xl bg-white opacity-60 cursor-not-allowed">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Dữ liệu & đồng bộ</h3>
                <p className="text-sm text-gray-600">Sao lưu và đồng bộ dữ liệu</p>
              </div>
            </div>
          </div>

          <div className="w-full p-4 rounded-xl bg-white opacity-60 cursor-not-allowed">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Giới thiệu</h3>
                <p className="text-sm text-gray-600">Thông tin ứng dụng và hỗ trợ</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Settings Detail */}
      <div className="flex-1 bg-white p-8 overflow-y-auto">
        {activeSection === 'giao-dien' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Giao diện</h2>
            <p className="text-gray-600 mb-8">Tùy chỉnh cách Mindraft hiển thị và hoạt động</p>

            <div className="space-y-8">
              {/* Theme Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Chế độ giao diện</h3>
                <p className="text-sm text-gray-600 mb-4">Chọn giao diện phù hợp với môi trường làm việc của bạn</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                      theme === 'light'
                        ? 'bg-white border-gray-300'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Sáng</span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                      theme === 'dark'
                        ? 'bg-black text-white border-black'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Tối</span>
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                      theme === 'system'
                        ? 'bg-white border-gray-300'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Hệ thống</span>
                  </button>
                </div>
              </div>

              {/* View Mode Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Chế độ xem mặc định</h3>
                <p className="text-sm text-gray-600 mb-4">Chọn cách hiển thị ghi chú khi mở ứng dụng</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-black text-white border-black'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span>Lưới</span>
                  </button>

                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                      viewMode === 'list'
                        ? 'bg-black text-white border-black'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>Danh sách</span>
                  </button>
                </div>
              </div>

              {/* Sort By Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sắp xếp theo</h3>
                <p className="text-sm text-gray-600 mb-4">Chọn cách sắp xếp ghi chú trong danh sách</p>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Ngày tạo</SelectItem>
                    <SelectItem value="modified">Ngày chỉnh sửa</SelectItem>
                    <SelectItem value="title">Tiêu đề</SelectItem>
                    <SelectItem value="priority">Mức độ ưu tiên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Options */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Tùy chọn hiển thị</h3>
                <p className="text-sm text-gray-600 mb-4">Các tùy chọn bổ sung cho giao diện</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'thong-bao' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Thông báo</h2>
            <p className="text-gray-600 mb-8">Quản lý thông báo và nhắc nhở</p>

            <div className="space-y-6">
              {/* Reminder Notifications */}
              <div className="flex items-start justify-between py-4 border-b border-gray-200">
                <div className="flex-1 pr-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Thông báo nhắc nhở</h3>
                  <p className="text-sm text-gray-600">Nhận thông báo khi có nhắc nhở đến hạn</p>
                </div>
                <Switch
                  checked={reminderNotifications}
                  onCheckedChange={setReminderNotifications}
                />
              </div>

              {/* Collaboration Notifications */}
              <div className="flex items-start justify-between py-4 border-b border-gray-200">
                <div className="flex-1 pr-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Thông báo cộng tác</h3>
                  <p className="text-sm text-gray-600">Nhận thông báo khi có hoạt động cộng tác mới</p>
                </div>
                <Switch
                  checked={collaborationNotifications}
                  onCheckedChange={setCollaborationNotifications}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
