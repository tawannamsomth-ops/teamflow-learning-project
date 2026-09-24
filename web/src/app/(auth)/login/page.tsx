'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Typography,
} from 'antd';
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
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: '100dvh',
        background: '#f5f5f5',
        padding: 16,
      }}
    >
      <Card
        style={{ width: '100%', maxWidth: 400 }}
        styles={{ body: { padding: 28 } }}
      >
        <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4 }}>
          TeamFlow
        </Typography.Title>
        <Typography.Title level={4} style={{ marginTop: 0, fontWeight: 500 }}>
          Sign in
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Workspaces, boards, and live tasks for small teams
        </Typography.Paragraph>

        {error ? (
          <Alert
            type="error"
            showIcon
            message={error}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError('')}
          />
        ) : null}

        <Form layout="vertical" size="large" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
          >
            <Input autoComplete="email" inputMode="email" placeholder="you@company.com" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Enter your password' }]}
          >
            <Input.Password autoComplete="current-password" placeholder="••••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} size="large">
            Sign in
          </Button>
        </Form>

        <Typography.Paragraph style={{ marginTop: 20, marginBottom: 0, textAlign: 'center' }}>
          No account? <Link href="/register">Create one</Link>
        </Typography.Paragraph>
      </Card>
    </Flex>
  );
}
