'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { api, setAuth } from '@/lib/api';
import type { User } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onFinish(values: {
    name: string;
    email: string;
    password: string;
  }) {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ accessToken: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setAuth(res.accessToken, res.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
      <Card style={{ width: 420 }}>
        <Typography.Title level={2} style={{ marginTop: 0, textAlign: 'center' }}>
          TeamFlow
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          Create an account and get a workspace instantly
        </Typography.Paragraph>
        {error ? (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        ) : null}
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Create account
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          Have an account? <Link href="/login">Sign in</Link>
        </Typography.Paragraph>
      </Card>
    </Flex>
  );
}
