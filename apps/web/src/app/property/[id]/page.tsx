import type { Metadata } from 'next';
import PropertyDetail from '@/components/features/properties/PropertyDetail';

// This would typically come from an API
const getPropertyById = async (id: string) => {
  // In a real app, this would be an API call
  // For now, we're mocking it and leveraging the component's built-in data
  return { id };
};

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Fetch property details to use in metadata
  // In a real app, this would come from an API
  return {
    title: `Property ${params.id} | StellarRent`,
    description: `View details and book property ${params.id} with cryptocurrency on StellarRent.`,
  };
}

export default async function PropertyPage({ params }: Props) {
  const { id } = params;
  
  // In a real app, this would fetch property data from an API
  // and pass it to the PropertyDetail component
  await getPropertyById(id);
  
  return <PropertyDetail id={id} />;
}
