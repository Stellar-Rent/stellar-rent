'use client';

import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PropertyMapProps } from '@/lib/types/property';

export function PropertyMap({
  address,
  coordinates = { lat: -34.6037, lng: -58.3816 }, // Default to Buenos Aires
  neighborhoodInfo = {
    walkability: 'Very Walkable',
    transitScore: 'Excellent',
    bikeScore: 'Bikeable',
    restaurants: '5 min walk',
    grocery: '3 min walk',
    publicTransit: '2 min walk',
  },
  className = '',
}: PropertyMapProps) {
  const [mapError, _setMapError] = useState(false);

  // Generate Google Maps URLs
  const getGoogleMapsUrl = () => {
    const query = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const getDirectionsUrl = () => {
    const query = encodeURIComponent(address);
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getDirectionsUrl(), '_blank')}
              className="flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getGoogleMapsUrl(), '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Maps
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground mb-4">{address}</p>

        {/* Map Container */}
        <div className="relative h-[300px] bg-muted rounded-lg overflow-hidden">
          {!mapError ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 flex items-center justify-center">
              {/* Placeholder map with coordinates */}
              <div className="text-center space-y-2">
                <MapPin className="w-12 h-12 mx-auto text-primary" />
                <div className="text-sm font-medium">Interactive Map</div>
                <div className="text-xs text-muted-foreground">
                  {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getGoogleMapsUrl(), '_blank')}
                  className="mt-2"
                >
                  View on Google Maps
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center space-y-2">
                <MapPin className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Map unavailable</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getGoogleMapsUrl(), '_blank')}
                >
                  View on Google Maps
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Neighborhood Info */}
        <div className="mt-4 space-y-3">
          <h4 className="font-medium">About the neighborhood</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Walkability</span>
                <span className="font-medium">{neighborhoodInfo.walkability}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transit Score</span>
                <span className="font-medium">{neighborhoodInfo.transitScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bike Score</span>
                <span className="font-medium">{neighborhoodInfo.bikeScore}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Restaurants</span>
                <span className="font-medium">{neighborhoodInfo.restaurants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grocery</span>
                <span className="font-medium">{neighborhoodInfo.grocery}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Public Transit</span>
                <span className="font-medium">{neighborhoodInfo.publicTransit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
