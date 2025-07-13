import React, { useEffect, useState } from 'react';
import { Card, Button, List, message, Typography, Popconfirm, Modal, Form, Upload, Input } from 'antd';
import { DeleteOutlined, EyeOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { request } from './utils/request';

const { Title } = Typography;
const API = '/api/resource';
const BASE_URL = 'http://localhost:5000';

export default function MyQuestionPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [file, setFile] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const getToken = () => {
    return localStorage.getItem('token') || '';
  };

  const fetchList = async () => {
    if (!localStorage.getItem('token')) return;
    setLoading(true);
    try {
      const data = await request(`${API}?type=question&mine=1`);
      setList(data);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { fetchList(); }, []);

  const handleUpload = () => {
    setEditItem(null);
    setFile(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setFile(null);
    form.setFieldsValue({ title: item.title || '', desc: item.desc || '', content: item.content || '' });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await request(`${API}/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      fetchList();
    } catch (e) {}
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (!file) {
        message.error('请上传文件');
        return;
      }
      const formData = new FormData();
      formData.append('type', 'question');
      formData.append('title', values.title);
      formData.append('desc', values.desc || '');
      formData.append('content', values.content || '');
      formData.append('file', file);
      if (editItem) {
        formData.append('id', editItem.id);
      }
      await request(editItem ? `${API}/${editItem.id}` : API, {
        method: editItem ? 'PUT' : 'POST',
        body: formData
      });
      message.success(editItem ? '编辑成功' : '新建成功');
      setModalOpen(false);
      fetchList();
    } catch (e) {}
  };

  const downloadFile = async (id, title, ext) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/resource/download/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      window.message && window.message.error ? window.message.error('下载失败，请重新登录') : alert('下载失败，请重新登录');
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <Title level={3}>我的试题</Title>
      <Button icon={<UploadOutlined />} type="primary" onClick={handleUpload} style={{ marginBottom: 16 }}>新建试题</Button>
      <List
        grid={{ gutter: 24, column: 2 }}
        loading={loading}
        dataSource={list}
        style={{ marginTop: 24 }}
        renderItem={item => (
          <List.Item>
            <Card
              title={item.title}
              extra={<>
                <Button icon={<EyeOutlined />} size="small" onClick={() => item.cover ? setPreview(BASE_URL + item.cover) : message.warning('无可预览文件')}>预览</Button>
                <Button
                  icon={<DownloadOutlined />}
                  size="small"
                  style={{ marginLeft: 8 }}
                  onClick={() => downloadFile(item.id, item.title ? item.title.replace(/\s+/g, '_') : '下载文件', item.cover ? item.cover.substring(item.cover.lastIndexOf('.')) : '')}
                >
                  下载
                </Button>
                <Button icon={<UploadOutlined />} size="small" onClick={() => handleEdit(item)} style={{ marginLeft: 8 }}>编辑</Button>
                <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item.id)}><Button icon={<DeleteOutlined />} size="small" danger style={{ marginLeft: 8 }}>删除</Button></Popconfirm>
              </>}
              style={{ minHeight: 120 }}
            >
              <div>上传时间：{item.created_at?.slice(0, 10)}</div>
            </Card>
          </List.Item>
        )}
      />
      <ModalQuestionDetail detail={detail} onClose={() => setDetail(null)} />
      <Modal
        open={modalOpen}
        title={editItem ? '编辑试题' : '新建试题'}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
        okText="提交"
        styles={{ body: { padding: '32px 40px 24px' } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="desc" label="简介">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}> 
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>上传附件 <span style={{ color: 'red' }}>*</span></div>
          <Upload beforeUpload={f => { setFile(f); return false; }} maxCount={1} accept=".jpg,.png,.mp3,.wav,.pdf,.doc,.docx" listType="text" fileList={file ? [{ uid: '-1', name: file.name }] : []} onRemove={() => setFile(null)}>
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          {!file && <div style={{ color: 'red', marginTop: 4 }}>请上传文件</div>}
        </div>
      </Modal>
      <ModalQuestionPreview url={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function getFileType(url: string) {
  if (!url) return '';
  const cleanUrl = url.split('?')[0];
  const ext = cleanUrl.split('.').pop()?.toLowerCase();
  if (!ext) return '';
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "aac", "ogg"].includes(ext)) return "audio";
  return '';
}

function ModalQuestionPreview({ url, onClose }: { url: string | null, onClose: () => void }) {
  const type = url ? getFileType(url) : '';
  return (
    <Modal open={!!url} onCancel={onClose} footer={null} width={800} styles={{ body: { padding: 0, minHeight: 400 } }}>
      {url ? (
        <div style={{textAlign:'center'}}>
          {type === 'pdf' ? (
            <iframe src={url} width="100%" height={600} title="PDF预览" style={{ border: 'none' }} />
          ) : type === 'word' ? (
            <iframe
              src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`}
              width="100%"
              height={600}
              title="Word在线预览"
              style={{ border: 'none' }}
            />
          ) : type === 'ppt' ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>PPT文件暂不支持在线预览，请下载后用本地软件打开。</div>
          ) : type === 'image' ? (
            <img src={url} alt="图片预览" style={{ maxWidth: '100%', maxHeight: 600, display: 'block', margin: '0 auto' }} />
          ) : type === 'video' ? (
            <video src={url} controls style={{ width: '100%', maxHeight: 600, display: 'block', margin: '0 auto' }} />
          ) : type === 'audio' ? (
            <audio src={url} controls style={{ width: '100%', display: 'block', margin: '40px auto' }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>暂不支持该格式预览</div>
          )}
          <a href={url} download target="_blank" rel="noopener noreferrer" style={{display:'inline-block',marginTop:16}}>
            <Button icon={<DownloadOutlined />}>下载原文件</Button>
          </a>
        </div>
      ) : null}
    </Modal>
  );
}

function ModalQuestionDetail({ detail, onClose }: { detail: any, onClose: () => void }) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  return (
    <>
      <Modal open={!!detail} onCancel={onClose} footer={null} width={600}>
        {detail ? (
          <div>
            <div><b>题目内容：</b>{detail.content}</div>
            <div><b>答案：</b>{detail.desc}</div>
            {detail.content && (
              <Button type="link" onClick={() => setPreviewUrl(detail.content)}>预览附件</Button>
            )}
          </div>
        ) : null}
      </Modal>
      <ModalQuestionPreview url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </>
  );
} 