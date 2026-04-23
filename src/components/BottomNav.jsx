// 底部导航 - 5 tab（首页/燃烧/日榜/邀请/社区）
export default function BottomNav({ activeTab, onNavigate }) {
  const tabs = [
    { id: 'home', label: '首页' },
    { id: 'burn', label: '燃烧' },
    { id: 'board', label: '日榜' },
    { id: 'invite', label: '邀请' },
    { id: 'community', label: '社区' },
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
