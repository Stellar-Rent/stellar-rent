import PropertyCard from "./PropertyCard";

type Property = {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  rating: number;
  distance: string | number;
};

export default function PropertyGrid({
  properties
}: {
  properties: Property[];
}) {
  console.log({ properties });
  if (properties.length < 1) {
    return (
      <div className=" w-full h-full grid place-items-center text-2xl font-bold text-white">
        No Properties found
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 overflow-y-scroll md:mt-8 md:h-[90vh] md:pb-32">
      {properties.map((property, i) => (
        <PropertyCard key={i} {...property} />
      ))}
    </div>
  );
}
