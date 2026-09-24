'use client';

import {
  ApiOutlined,
  BellOutlined,
  DashboardOutlined,
  LogoutOutlined,
  ProjectOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Flex,
  Layout,
  Menu,
  Space,
  Typography,
  theme,
} from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, clearAuth, getStoredUser } from '@/lib/api';
import type { Notification } from '@/lib/types';

const { Header, Sider, Content } = Layout;

const API_DOCS =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(
    /\/api$/,
    '/docs',
  );

export function AppShell({
  children,
  title,
  extra,
}: {
  children: React.ReactNode;
  title?: string;
  extra?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = theme.useToken();
  const [user, setUser] = useState(getStoredUser());
  const [unread, setUnread] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('tf_token')) {
      router.replace('/login');
      return;
    }
    setUser(getStoredUser());
    void api<Notification[]>('/notifications')
      .then((list) => setUnread(list.filter((n) => !n.read).length))
      .catch(() => undefined);
  }, [router, pathname]);

  const selected = pathname.startsWith('/workspaces')
    ? 'workspaces'
    : pathname.startsWith('/notifications')
      ? 'notifications'
      : pathname.startsWith('/projects')
        ? 'projects'
        : 'dashboard';

  function logout() {
    clearAuth();
    router.replace('/login');
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{ borderRight: `1px solid ${token.colorBorderSecondary}` }}
      >
        <Flex align="center" style={{ height: 64, paddingInline: 16 }}>
          <Typography.Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
            {collapsed ? 'TF' : 'TeamFlow'}
          </Typography.Title>
        </Flex>
        <Menu
          mode="inline"
          selectedKeys={[selected]}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: <Link href="/dashboard">Dashboard</Link>,
            },
            {
              key: 'workspaces',
              icon: <TeamOutlined />,
              label: <Link href="/workspaces">Workspaces</Link>,
            },
            {
              key: 'projects',
              icon: <ProjectOutlined />,
              label: <Link href="/dashboard">Projects</Link>,
            },
            {
              key: 'notifications',
              icon: (
                <Badge dot={unread > 0} offset={[2, 0]}>
                  <BellOutlined />
                </Badge>
              ),
              label: <Link href="/notifications">Notifications</Link>,
            },
            {
              key: 'docs',
              icon: <ApiOutlined />,
              label: (
                <a href={API_DOCS} target="_blank" rel="noreferrer">
                  API docs
                </a>
              ),
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            paddingInline: 24,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title ?? 'TeamFlow'}
          </Typography.Title>
          <Space>
            {extra}
            <Typography.Text type="secondary">{user?.name}</Typography.Text>
            <Button icon={<LogoutOutlined />} onClick={logout}>
              Sign out
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: token.colorBgLayout }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
