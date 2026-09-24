'use client';

import { Alert, Button, Card, Empty, List, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setItems(await api<Notification[]>('/notifications'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markRead(id: string) {
    await api(`/notifications/${id}/read`, { method: 'PATCH' });
    await load();
  }

  return (
    <AppShell title="Notifications">
      {error ? (
        <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
      ) : null}
      <Card>
        <List
          loading={loading}
          locale={{ emptyText: <Empty description="No notifications" /> }}
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              actions={
                item.read
                  ? []
                  : [
                      <Button key="read" type="link" onClick={() => void markRead(item.id)}>
                        Mark read
                      </Button>,
                    ]
              }
            >
              <List.Item.Meta
                title={
                  <Typography.Text>
                    {item.title}{' '}
                    {!item.read ? <Tag color="red">Unread</Tag> : <Tag>Read</Tag>}
                  </Typography.Text>
                }
                description={
                  <>
                    <div>{item.body}</div>
                    <Typography.Text type="secondary">
                      {new Date(item.createdAt).toLocaleString()}
                    </Typography.Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </AppShell>
  );
}
