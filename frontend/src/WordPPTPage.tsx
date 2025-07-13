import React, { useState } from 'react';
import { Upload, Button, Typography, Card, message, Modal, List } from 'antd';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title } = Typography;
const API = '/api/resource';

export default function WordPPTPage() {
  const [file, setFile] = useState<any>(null);
  const [pptUrl, setPptUrl] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const token = localStorage.getItem('token');

  const handleUpload = async (info: any) => {
    setFile(info.file);
    // 这里模拟上传Word并生成PPT，保存到后端
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: 'ppt',
        title: info.file.name.replace(/\.[^.]+$/, ''),
        content: '由Word自动生成的PPT内容',
        desc: '',
        cover: '/demo/demo.pdf'
      })
    });
    if (res.ok) {
      message.success('PPT已保存到"我的PPT"');
      setPptUrl('/demo/demo.pdf');
      setResults([...results, { name: info.file.name.replace(/\.[^.]+$/, ''), url: '/demo/demo.pdf' }]);
    } else {
      message.error('生成失败');
    }
  };

  return (
    <div style={{padding:32, maxWidth:600, margin:'0 auto'}}>
      <Title level={3}>Word转PPT</Title>
      <Upload beforeUpload={() => false} maxCount={1} showUploadList={false} customRequest={handleUpload} accept=".doc,.docx">
        <Button icon={<UploadOutlined />}>上传Word文档</Button>
      </Upload>
      <List
        header={<div>生成结果</div>}
        bordered
        dataSource={results}
        style={{marginTop:32}}
        renderItem={item => (
          <List.Item>
            <Card size="small" style={{width:'100%'}}>
              <a onClick={() => setPptUrl(item.url)}>{item.name}</a>
            </Card>
          </List.Item>
        )}
      />
      <Modal open={!!pptUrl} onCancel={() => setPptUrl(null)} footer={null} width={800}>
        {pptUrl && <iframe src={pptUrl} width="100%" height={600} title="PPT预览" />}
      </Modal>
    </div>
  );
} 