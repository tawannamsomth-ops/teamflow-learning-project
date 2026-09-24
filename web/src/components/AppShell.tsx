'use client';

import {
  BellOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Flex,
  Grid,
  Layout,
  Menu,
  Space,
  Typography,
  theme,
} from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api, clearAuth, getStoredUser } from '@/lib/api';
import type { Notification } from '@/lib/types';

const { Header, Sider, Content } = Layout;

function navKey(pathname: string) {
  if (pathname.startsWith('/workspaces')) return 'workspaces';
  if (pathname.startsWith('/notifications')) return 'notifications';
  if (pathname.startsWith('/projects')) return 'projects';
  return 'dashboard';
}

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
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [user, setUser] = useState(getStoredUser());
  const [unread, setUnread] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const selected = navKey(pathname);

  const menuItems = useMemo(
    () => [
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
        label: <Link href="/projects">Projects</Link>,
      },
      {
        key: 'notifications',
        icon: (
          <Badge count={unread} size="small" offset={[4, 0]}>
            <BellOutlined />
          </Badge>
        ),
        label: <Link href="/notifications">Notifications</Link>,
      },
    ],
    [unread],
  );

  function logout() {
    clearAuth();
    router.replace('/login');
  }

  const sideMenu = (
    <Menu
      mode="inline"
      selectedKeys={[selected]}
      items={menuItems}
      style={{ borderInlineEnd: 0 }}
      onClick={() => setDrawerOpen(false)}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile ? (
        <Sider
          width={220}
          theme="light"
          style={{
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            height: '100vh',
          }}
        >
          <Flex align="center" style={{ height: 56, paddingInline: 20 }}>
            <Typography.Title
              level={4}
              style={{ margin: 0, color: token.colorPrimary, letterSpacing: -0.3 }}
            >
              TeamFlow
            </Typography.Title>
          </Flex>
          {sideMenu}
        </Sider>
      ) : null}

      <Layout style={{ minWidth: 0 }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: token.colorBgContainer,
            paddingInline: isMobile ? 12 : 24,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            height: 56,
            lineHeight: '56px',
          }}
        >
          <Flex align="center" gap={8} style={{ minWidth: 0 }}>
            {isMobile ? (
              <Button
                type="text"
                aria-label="Open navigation"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                style={{ width: 44, height: 44 }}
              />
            ) : null}
            <Typography.Title
              level={4}
              style={{
                margin: 0,
                fontSize: isMobile ? 16 : 18,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title ?? 'TeamFlow'}
            </Typography.Title>
          </Flex>

          <Space size={8} wrap={false}>
            {!isMobile ? extra : null}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'user',
                    label: user?.email ?? 'Account',
                    disabled: true,
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Sign out',
                    onClick: logout,
                  },
                ],
              }}
              placement="bottomRight"
            >
              <Button
                type="text"
                aria-label="Account menu"
                style={{ height: 44, paddingInline: 8 }}
              >
                <Space size={8}>
                  <Avatar size={28} icon={<UserOutlined />} style={{ background: token.colorPrimary }}>
                    {user?.name?.slice(0, 1)?.toUpperCase()}
                  </Avatar>
                  {!isMobile ? (
                    <Typography.Text ellipsis style={{ maxWidth: 120 }}>
                      {user?.name}
                    </Typography.Text>
                  ) : null}
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {isMobile && extra ? (
          <div
            style={{
              padding: '12px 12px 0',
              background: token.colorBgLayout,
            }}
          >
            <Flex wrap gap={8}>
              {extra}
            </Flex>
          </div>
        ) : null}

        <Content
          style={{
            padding: isMobile ? 12 : 24,
            background: token.colorBgLayout,
          }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
            {children}
          </div>
        </Content>
      </Layout>

      <Drawer
        title="TeamFlow"
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size={280}
        styles={{ body: { padding: 0 } }}
      >
        {sideMenu}
      </Drawer>
    </Layout>
  );
}
