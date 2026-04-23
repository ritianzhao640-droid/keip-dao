// Toast 弹窗组件 - 自动消失，非阻塞
import { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

let globalToastFn = null;

/** 全局 toast 调用（可在任意位置使用） */
export function showToast(message, type = 'info', duration = 2500) {
  if (globalToastFn) globalToastFn({ message, type, duration });
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 2500);
  }, []);

  // 暴露给外部
  useState(() => { globalToastFn = addToast; });

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast 容器 - 固定在顶部居中 */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
