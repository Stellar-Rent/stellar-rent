import type { Meta, StoryObj } from '@storybook/react';
import { ErrorDisplay } from './error-display';

const meta: Meta<typeof ErrorDisplay> = {
  title: 'UI/ErrorDisplay',
  component: ErrorDisplay,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning'],
    },
    onRetry: { action: 'retry' },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorDisplay>;

export const Default: Story = {
  args: {
    title: 'Connection Error',
    message:
      'We were unable to connect to the server. Please check your internet connection and try again.',
    variant: 'default',
  },
};

export const Destructive: Story = {
  args: {
    title: 'Action Failed',
    message:
      'The requested action could not be completed because the resource was not found or has been deleted.',
    variant: 'destructive',
    onRetry: () => console.log('Retrying...'),
  },
};

export const Warning: Story = {
  args: {
    title: 'Limited Access',
    message:
      'Your account has limited access to this feature. Some functionality may be restricted.',
    variant: 'warning',
  },
};

export const WithoutTitle: Story = {
  args: {
    message: 'An unexpected error occurred. Please try again later.',
    onRetry: () => console.log('Retrying...'),
  },
};
