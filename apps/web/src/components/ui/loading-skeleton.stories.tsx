import type { Meta, StoryObj } from '@storybook/react';
import { FullPageLoader, LoadingGrid, PropertyCardSkeleton, Spinner } from './loading-skeleton';

const meta: Meta<typeof LoadingGrid> = {
  title: 'UI/LoadingStates',
  component: LoadingGrid,
  tags: ['autodocs'],
};

export default meta;

export const GridDefault: StoryObj<typeof LoadingGrid> = {
  args: {
    count: 6,
    columns: 3,
  },
};

export const CardSkeleton: StoryObj<typeof PropertyCardSkeleton> = {
  render: () => (
    <div className="max-w-sm">
      <PropertyCardSkeleton />
    </div>
  ),
};

export const SpinnerDefault: StoryObj<typeof Spinner> = {
  render: () => <Spinner label="Loading results..." />,
};

export const LargeSpinner: StoryObj<typeof Spinner> = {
  render: () => <Spinner size="lg" label="Processing your payment..." />,
};

export const PageLoader: StoryObj<typeof FullPageLoader> = {
  render: () => <FullPageLoader message="Configuring your dashboard..." />,
};
