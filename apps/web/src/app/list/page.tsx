'use client';
import ListingForm from '~/components/properties/ListingForm';
import { useAuthGuard } from '~/hooks/auth/use-auth-guard';

const Page = () => {
  const { isLoading } = useAuthGuard();
  if (isLoading) return <div>Please wait... checking authentication status</div>;
  return (
    <div className="max-w-xl mx-auto my-10 px-4">
      <ListingForm />
    </div>
  );
};

export default Page;
