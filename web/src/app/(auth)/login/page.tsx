'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { api, setAuth } from '@/lib/api';
import type { User } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onFinish(values: { email: string; password: string }) {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ accessToken: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setAuth(res.accessToken, res.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: '100vh', background: '#f0f2f5', padding: 24 }}
    >
      <Card style={{ width: 420 }} title={null}>
        <Typography.Title level={2} style={{ marginTop: 0, textAlign: 'center' }}>
          TeamFlow
        </Typography.Title>
        <Typography.Title level={4} style={{ marginTop: 0, textAlign: 'center' }}>
          Sign in
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          Manage workspaces, boards, and tasks
        </Typography.Paragraph>
        {error ? (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        ) : null}
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="you@company.com" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign in
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          No account? <Link href="/register">Create one</Link>
        </Typography.Paragraph>
      </Card>
    </Flex>
  );
}
