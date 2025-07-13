import React, { useState } from 'react';
import { Upload, Button, Form, Input, Typography, Card, message, Modal, List } from 'antd';
import { UploadOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;
const API = '/api/resource';

export default function VideoPage() {
  const [form] = Form.useForm();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const token = localStorage.getItem('token');

  const onFinish = async (values: any) => {
    // 这里模拟生成视频并保存到后端
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: 'video',
        title: values.title || 'AI生成视频',
        content: '自动生成的视频内容',
        desc: values.script || '',
        cover: '/demo/demo.mp4'
      })
    });
    if (res.ok) {
      message.success('视频生成并已保存到"我的视频"');
      setResults([...results, { name: values.title || 'AI生成视频', url: '/demo/demo.mp4' }]);
      setVideoUrl('/demo/demo.mp4');
    } else {
      message.error('生成失败');
    }
  };

  return (
    <div style={{padding:32, maxWidth:600, margin:'0 auto'}}>
      <Title level={3}>视频制作</Title>
      <Form form={form} layout="vertical" onFinish={onFinish} style={{marginTop:24}}>
        <Form.Item name="title" label="视频标题" rules={[{ required: true, message: '请输入视频标题' }]}> <Input placeholder="如：市场分析讲解" /> </Form.Item>
        <Form.Item name="script" label="视频脚本"> <Input.TextArea rows={3} placeholder="可选，输入视频讲解脚本" /> </Form.Item>
        <Form.Item> <Button type="primary" htmlType="submit">生成视频</Button> </Form.Item>
      </Form>
      <List
        header={<div>生成结果</div>}
        bordered
        dataSource={results}
        style={{marginTop:32}}
        renderItem={item => (
          <List.Item>
            <Card size="small" style={{width:'100%'}}>
              <a onClick={() => setVideoUrl(item.url)}>{item.name}</a>
            </Card>
          </List.Item>
        )}
      />
      <Modal open={!!videoUrl} onCancel={() => setVideoUrl(null)} footer={null} width={800}>
        {videoUrl && <video src={videoUrl} controls width="100%" />}
      </Modal>
    </div>
  );
} 