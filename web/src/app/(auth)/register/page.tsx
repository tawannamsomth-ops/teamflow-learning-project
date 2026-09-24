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
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: '100dvh', background: '#f5f5f5', padding: 16 }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }} styles={{ body: { padding: 28 } }}>
        <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4 }}>
          TeamFlow
        </Typography.Title>
        <Typography.Title level={4} style={{ marginTop: 0, fontWeight: 500 }}>
          Create account
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          You get a personal workspace right away
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
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input autoComplete="name" placeholder="Your name" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input autoComplete="email" inputMode="email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, min: 6, message: 'At least 6 characters' }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} size="large">
            Create account
          </Button>
        </Form>

        <Typography.Paragraph style={{ marginTop: 20, marginBottom: 0, textAlign: 'center' }}>
          Have an account? <Link href="/login">Sign in</Link>
        </Typography.Paragraph>
      </Card>
    </Flex>
  );
}
