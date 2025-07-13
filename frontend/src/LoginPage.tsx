import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message, Select } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';

const API = '/api/user';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      console.log('请求参数:', values);
      const res = await fetch(`${API}/${tab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      console.log('接口响应:', data);
      if (!res.ok) throw new Error(data.error || '操作失败');
      if (tab === 'login') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        message.success('登录成功');
        setTimeout(() => window.location.href = '/', 500);
      } else {
        message.success('注册成功，请登录');
        setTab('login');
      }
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg,#e0e7ff,#fffbe6)' }}>
      <Card style={{ width: 380, boxShadow: '0 2px 16px #eee', borderRadius: 16, padding: 0 }}>
        <div style={{ textAlign: 'center', margin: '24px 0 8px 0' }}>
          <img src="/logo192.png" alt="logo" style={{ width: 48, marginBottom: 8 }} />
          <div style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>数字资源生成平台</div>
        </div>
        <Tabs activeKey={tab} onChange={setTab} centered items={[
          { key: 'login', label: '登录' },
          { key: 'register', label: '注册' }
        ]} />
        <Form layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }} autoComplete="off">
          <Form.Item name="username" label="用户名" rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, max: 20, message: '用户名3-20位' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '仅支持字母、数字、下划线' }
          ]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, max: 20, message: '密码6-20位' },
            { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_]+$/, message: '必须包含字母和数字' }
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          {tab === 'register' && (
            <Form.Item name="role" label="角色" initialValue="teacher" rules={[{ required: true }]}> 
              <Select prefix={<TeamOutlined />}>
                <Select.Option value="teacher">老师</Select.Option>
                <Select.Option value="student">学生</Select.Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item> <Button type="primary" htmlType="submit" block loading={loading}>{tab === 'login' ? '登录' : '注册'}</Button> </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 