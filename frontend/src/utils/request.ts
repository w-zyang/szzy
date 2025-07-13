// 统一请求封装，自动携带token、401拦截、错误提示
export async function request(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return Promise.reject(new Error('未登录或登录已过期'));
  }
  if (!res.ok) {
    let msg = '请求失败';
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {}
    alert(msg);
    return Promise.reject(new Error(msg));
  }
  // 尝试解析json，否则返回原始res
  try {
    return await res.json();
  } catch {
    return res;
  }
} 