import type { Meta, StoryObj } from '@storybook/react';
import { MOCK_PROPERTIES } from 'public/mock-data';
import PropertyGrid from './PropertyGrid';

const meta: Meta<typeof PropertyGrid> = {
  title: 'Features/Search/PropertyGrid',
  component: PropertyGrid,
  tags: ['autodocs'],
  argTypes: {
    onRetry: { action: 'retry' },
    onLoadMore: { action: 'load more' },
  },
};

export default meta;
type Story = StoryObj<typeof PropertyGrid>;

export const Loaded: Story = {
  args: {
    properties: MOCK_PROPERTIES.slice(0, 6),
    isLoading: false,
    error: null,
  },
};

export const InitialLoading: Story = {
  args: {
    properties: [],
    isLoading: true,
    error: null,
  },
};

export const LoadingMore: Story = {
  args: {
    properties: MOCK_PROPERTIES.slice(0, 3),
    isLoading: true,
    error: null,
  },
};

export const WithError: Story = {
  args: {
    properties: [],
    isLoading: false,
    error: 'The search service is currently unavailable. Please try again in a few moments.',
  },
};

export const Empty: Story = {
  args: {
    properties: [],
    isLoading: false,
    error: null,
  },
};
