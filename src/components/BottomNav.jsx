// 底部导航 - 5 tab（首页/燃烧/日榜/邀请/社区），管理员额外显示设置tab
export default function BottomNav({ activeTab, onNavigate, isAdmin = false }) {
  const tabs = [
    { id: 'home', label: '首页' },
    { id: 'burn', label: '燃烧' },
    { id: 'board', label: '日榜' },
    { id: 'invite', label: '邀请' },
    { id: 'community', label: '社区' },
    ...(isAdmin ? [{ id: 'settings', label: '设置' }] : []),
  ];

  return (
    <div className="tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => onNavigate(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
