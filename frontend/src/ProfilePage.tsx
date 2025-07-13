import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Button, message, Select, Descriptions, Modal } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const API_LOGIN = '/api/user/login';
const API_REGISTER = '/api/user/register';

export default function ProfilePage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [showLogout, setShowLogout] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const api = tab === 'login' ? API_LOGIN : API_REGISTER;
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (tab === 'login' ? '登录失败' : '注册失败'));
      if (tab === 'login') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        message.success('登录成功');
        setTimeout(() => window.location.reload(), 500);
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

  const handleLogout = () => {
    setShowLogout(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    setTimeout(() => window.location.reload(), 500);
  };

  if (!localStorage.getItem('token') || !user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Card style={{ width: 380, borderRadius: 12, boxShadow: '0 2px 16px #e0e7ff' }}>
          <Tabs activeKey={tab} onChange={setTab} centered items={[
            { key: 'login', label: '登录' },
            { key: 'register', label: '注册' }
          ]} />
          <Form form={form} name={tab} onFinish={onFinish} layout="vertical" requiredMark style={{ marginTop: 16 }}>
            <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}> 
              <Input prefix={<UserOutlined />} placeholder="用户名" autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}> 
              <Input.Password prefix={<LockOutlined />} placeholder="密码" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
            </Form.Item>
            {tab === 'register' && (
              <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}> 
                <Select placeholder="请选择角色">
                  <Select.Option value="user">普通用户</Select.Option>
                  <Select.Option value="admin">管理员</Select.Option>
                </Select>
              </Form.Item>
            )}
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>{tab === 'login' ? '登录' : '注册'}</Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 2px 16px #e0e7ff' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>个人中心</h2>
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="角色">{user.role}</Descriptions.Item>
        </Descriptions>
        <Button type="primary" danger block style={{ marginTop: 32 }} onClick={() => setShowLogout(true)}>退出登录</Button>
        <Modal open={showLogout} onOk={handleLogout} onCancel={() => setShowLogout(false)} okText="确认退出" cancelText="取消">
          确认要退出登录吗？
        </Modal>
      </Card>
    </div>
  );
} 