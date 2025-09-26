'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/lib/types/database';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface PropertyListProps {
  portfolioId: string;
  onPropertySelect?: (property: Property) => void;
  onAddProperty?: () => void;
  className?: string;
}

export default function PropertyList({
  portfolioId,
  onPropertySelect,
  onAddProperty,
  className,
}: PropertyListProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/portfolios/${portfolioId}/properties`);

        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }

        const data = await response.json();
        setProperties(data.properties || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [portfolioId]);

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property.id);
    onPropertySelect?.(property);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: 'Appartement',
      house: 'Maison',
      commercial: 'Commercial',
      parking: 'Parking',
      land: 'Terrain',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardContent>
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card className={cn('text-center py-12', className)}>
        <CardContent>
          <div className="text-gray-500 mb-4">No properties found</div>
          {onAddProperty && (
            <Button onClick={onAddProperty}>
              Add Your First Property
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Properties ({properties.length})
        </h2>
        {onAddProperty && (
          <Button onClick={onAddProperty} size="sm">
            Add Property
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card
            key={property.id}
            className={cn(
              'cursor-pointer transition-all duration-200',
              'hover:shadow-md hover:border-blue-300',
              selectedProperty === property.id && 'border-blue-500 bg-blue-50',
              'relative overflow-hidden'
            )}
            onClick={() => handlePropertyClick(property)}
          >
            <CardHeader>
              <CardTitle className="text-base">
                {property.address}
              </CardTitle>
              <div className="text-sm text-gray-600">
                {property.city}
                {property.postal_code && ` • ${property.postal_code}`}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {/* Property Type and Subtype */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
                    {getPropertyTypeLabel(property.property_type)}
                  </span>
                  {property.property_subtype && (
                    <span className="text-xs text-gray-500">
                      {property.property_subtype}
                    </span>
                  )}
                </div>

                {/* Financial Information */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Value</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(property.current_value)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Acquisition</span>
                    <span className="text-sm">
                      {formatCurrency(property.acquisition_price)}
                    </span>
                  </div>

                  {/* Capital Gain */}
                  {property.current_value !== property.acquisition_price && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gain</span>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          property.current_value > property.acquisition_price
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {formatCurrency(property.current_value - property.acquisition_price)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  {property.surface_area && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{property.surface_area}m²</span>
                    </div>
                  )}
                  {property.number_of_rooms && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{property.number_of_rooms} rooms</span>
                    </div>
                  )}
                  {property.rental_type && (
                    <div className="text-xs text-gray-600 col-span-2">
                      {property.rental_type === 'furnished' ? 'Furnished' : 'Unfurnished'}
                    </div>
                  )}
                </div>

                {/* Acquisition Date */}
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Acquired: {new Date(property.acquisition_date).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </CardContent>

            {/* Status Indicator */}
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}