'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App, ConfigProvider } from 'antd';

/** Modern SaaS tokens — one accent, readable type, touch-friendly controls */
const theme = {
  token: {
    colorPrimary: '#1668dc',
    colorInfo: '#1668dc',
    colorSuccess: '#389e0d',
    colorWarning: '#d48806',
    colorError: '#cf1322',
    colorBgLayout: '#f5f5f5',
    colorBgContainer: '#ffffff',
    borderRadius: 10,
    fontSize: 15,
    controlHeight: 40,
    controlHeightLG: 44,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerHeight: 56,
      siderBg: '#ffffff',
    },
    Menu: {
      itemHeight: 44,
      iconSize: 18,
    },
    Button: {
      controlHeight: 40,
      paddingInline: 16,
    },
    Table: {
      cellPaddingBlock: 12,
    },
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
