'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Property {
  id: string;
  name: string;
  address: string;
  purchase_price: number;
  current_value: number;
  monthly_rent: number;
  type: string;
  status: string;
  tax_regime: 'LMNP' | 'SCI_IS';
  purchase_date: string;
  notary_fees: number;
  renovation_cost: number;
  charges?: number;
  surface?: number;
  rooms?: number;
  city?: string;
  postal_code?: string;
  country?: string;
}

interface PropertyFormProps {
  property?: Property | null;
  onSave: (property: Property) => void;
  onCancel: () => void;
}

export default function PropertyForm({ property, onSave, onCancel }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    name: property?.name || '',
    address: property?.address || '',
    purchase_price: property?.purchase_price || 0,
    current_value: property?.current_value || 0,
    monthly_rent: property?.monthly_rent || 0,
    type: property?.type || 'Appartement',
    status: property?.status || 'Loué',
    tax_regime: property?.tax_regime || 'LMNP' as 'LMNP' | 'SCI_IS',
    purchase_date: property?.purchase_date || '',
    notary_fees: property?.notary_fees || 0,
    renovation_cost: property?.renovation_cost || 0,
    charges: property?.charges || 0,
    surface: property?.surface || 0,
    rooms: property?.rooms || 0,
    city: property?.city || '',
    postal_code: property?.postal_code || '',
    country: property?.country || 'France',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newProperty: Property = {
      id: property?.id || Date.now().toString(),
      ...formData,
    };

    onSave(newProperty);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader>
            <CardTitle>
              {property ? 'Modifier le bien' : 'Ajouter un bien'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nom du bien"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="Ex: Appartement Paris 11e"
                />

                <Input
                  label="Type de bien"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  required
                  placeholder="Ex: Appartement, Maison, Studio"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Surface (m²)"
                  type="number"
                  value={formData.surface}
                  onChange={(e) => handleChange('surface', Number(e.target.value))}
                  placeholder="75"
                />

                <Input
                  label="Nombre de pièces"
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => handleChange('rooms', Number(e.target.value))}
                  placeholder="3"
                />

                <Input
                  label="Charges mensuelles (€)"
                  type="number"
                  value={formData.charges}
                  onChange={(e) => handleChange('charges', Number(e.target.value))}
                  placeholder="150"
                />
              </div>

              <Input
                label="Adresse complète"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                required
                placeholder="123 Rue de la République"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Ville"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Paris"
                />

                <Input
                  label="Code postal"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  placeholder="75011"
                />

                <Input
                  label="Pays"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="France"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Régime fiscal
                  </label>
                  <select
                    value={formData.tax_regime}
                    onChange={(e) => handleChange('tax_regime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LMNP">LMNP (Loueur Meublé Non Professionnel)</option>
                    <option value="SCI_IS">SCI IS (Société Civile Immobilière)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Loué">Loué</option>
                    <option value="Vacant">Vacant</option>
                    <option value="En travaux">En travaux</option>
                  </select>
                </div>
              </div>

              <Input
                label="Date d'achat"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleChange('purchase_date', e.target.value)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Prix d'achat (€)"
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => handleChange('purchase_price', Number(e.target.value))}
                  required
                  placeholder="320000"
                />

                <Input
                  label="Valeur actuelle (€)"
                  type="number"
                  value={formData.current_value}
                  onChange={(e) => handleChange('current_value', Number(e.target.value))}
                  required
                  placeholder="380000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Loyer mensuel (€)"
                  type="number"
                  value={formData.monthly_rent}
                  onChange={(e) => handleChange('monthly_rent', Number(e.target.value))}
                  required
                  placeholder="1800"
                />

                <Input
                  label="Frais de notaire (€)"
                  type="number"
                  value={formData.notary_fees}
                  onChange={(e) => handleChange('notary_fees', Number(e.target.value))}
                  placeholder="22400"
                />

                <Input
                  label="Coût des travaux (€)"
                  type="number"
                  value={formData.renovation_cost}
                  onChange={(e) => handleChange('renovation_cost', Number(e.target.value))}
                  placeholder="15000"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button type="submit" className="flex-1">
                  {property ? 'Modifier' : 'Ajouter'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}