'use client';

import { Alert, Button, Card, Empty, List, Skeleton, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
        <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
      ) : null}

      <Card>
        {loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={items}
            locale={{
              emptyText: (
                <Empty
                  description="You're all caught up"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            renderItem={(item) => (
              <List.Item
                actions={
                  item.read
                    ? undefined
                    : [
                        <Button
                          key="read"
                          type="link"
                          onClick={() => void markRead(item.id)}
                          style={{ minHeight: 44 }}
                        >
                          Mark as read
                        </Button>,
                      ]
                }
              >
                <List.Item.Meta
                  title={
                    <Typography.Text>
                      {item.title}{' '}
                      {!item.read ? (
                        <Tag color="red">Unread</Tag>
                      ) : (
                        <Tag>Read</Tag>
                      )}
                    </Typography.Text>
                  }
                  description={
                    <>
                      <div style={{ marginBottom: 4 }}>{item.body}</div>
                      <Typography.Text type="secondary">
                        {new Date(item.createdAt).toLocaleString()}
                      </Typography.Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </AppShell>
  );
}
