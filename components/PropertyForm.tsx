'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Property {
  id: string;
  name: string;
  address: string;
  purchase_price: number;
  current_value: number;
  monthly_rent: number;
  property_type: 'apartment' | 'house' | 'building';
  status: string;
  tax_regime: 'LMNP' | 'SCI_IS';
  purchase_date: string;
  notary_fees: number;
  renovation_cost: number;
  monthly_charges: number;
  charge_eau?: number;
  charge_elec?: number;
  charge_compta?: number;
  charge_autres?: number;
  taxe_fonciere: number;
  meubles_achetes: boolean;
  meubles_cout?: number;
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
    property_type: property?.property_type || 'apartment' as 'apartment' | 'house' | 'building',
    status: property?.status || 'Loué',
    tax_regime: property?.tax_regime || 'LMNP' as 'LMNP' | 'SCI_IS',
    purchase_date: property?.purchase_date || '',
    notary_fees: property?.notary_fees || 0,
    renovation_cost: property?.renovation_cost || 0,
    monthly_charges: property?.monthly_charges || 0,
    charge_eau: property?.charge_eau || 0,
    charge_elec: property?.charge_elec || 0,
    charge_compta: property?.charge_compta || 0,
    charge_autres: property?.charge_autres || 0,
    taxe_fonciere: property?.taxe_fonciere || 0,
    meubles_achetes: property?.meubles_achetes || false,
    meubles_cout: property?.meubles_cout || 0,
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du bien *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    placeholder="Ex: Appartement Paris 11e"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de bien *
                  </label>
                  <Select value={formData.property_type} onValueChange={(value) => handleChange('property_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Appartement</SelectItem>
                      <SelectItem value="house">Maison</SelectItem>
                      <SelectItem value="building">Immeuble</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surface (m²)
                  </label>
                  <Input
                    type="number"
                    value={formData.surface}
                    onChange={(e) => handleChange('surface', Number(e.target.value))}
                    placeholder="75"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de pièces
                  </label>
                  <Input
                    type="number"
                    value={formData.rooms}
                    onChange={(e) => handleChange('rooms', Number(e.target.value))}
                    placeholder="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxe foncière annuelle (€) *
                  </label>
                  <Input
                    type="number"
                    value={formData.taxe_fonciere}
                    onChange={(e) => handleChange('taxe_fonciere', Number(e.target.value))}
                    placeholder="1200"
                    required
                  />
                </div>
              </div>

              {/* Section charges détaillées */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Charges mensuelles détaillées</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eau (€/mois)
                    </label>
                    <Input
                      type="number"
                      value={formData.charge_eau}
                      onChange={(e) => handleChange('charge_eau', Number(e.target.value))}
                      placeholder="40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Électricité (€/mois)
                    </label>
                    <Input
                      type="number"
                      value={formData.charge_elec}
                      onChange={(e) => handleChange('charge_elec', Number(e.target.value))}
                      placeholder="60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comptabilité (€/mois)
                    </label>
                    <Input
                      type="number"
                      value={formData.charge_compta}
                      onChange={(e) => handleChange('charge_compta', Number(e.target.value))}
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Autres charges (€/mois)
                    </label>
                    <Input
                      type="number"
                      value={formData.charge_autres}
                      onChange={(e) => handleChange('charge_autres', Number(e.target.value))}
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total charges mensuelles (€)
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_charges}
                    onChange={(e) => handleChange('monthly_charges', Number(e.target.value))}
                    placeholder="180"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Somme automatique: {(formData.charge_eau || 0) + (formData.charge_elec || 0) + (formData.charge_compta || 0) + (formData.charge_autres || 0)}€
                  </p>
                </div>
              </div>

              {/* Section meubles */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Achat de meubles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avez-vous acheté des meubles ?
                    </label>
                    <Select value={formData.meubles_achetes ? "true" : "false"} onValueChange={(value) => handleChange('meubles_achetes', value === "true")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui</SelectItem>
                        <SelectItem value="false">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.meubles_achetes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coût des meubles (€)
                      </label>
                      <Input
                        type="number"
                        value={formData.meubles_cout}
                        onChange={(e) => handleChange('meubles_cout', Number(e.target.value))}
                        placeholder="8000"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète *
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  required
                  placeholder="123 Rue de la République"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville *
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    required
                    placeholder="Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal *
                  </label>
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    required
                    placeholder="75011"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="France"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Régime fiscal *
                  </label>
                  <Select value={formData.tax_regime} onValueChange={(value) => handleChange('tax_regime', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le régime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LMNP">LMNP (Loueur Meublé Non Professionnel)</SelectItem>
                      <SelectItem value="SCI_IS">SCI IS (Société Civile Immobilière)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut du bien
                  </label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Loué">Loué</SelectItem>
                      <SelectItem value="Vacant">Vacant</SelectItem>
                      <SelectItem value="En travaux">En travaux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'achat *
                </label>
                <Input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleChange('purchase_date', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix d'achat (€) *
                  </label>
                  <Input
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => handleChange('purchase_price', Number(e.target.value))}
                    required
                    placeholder="320000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur actuelle estimée (€) *
                  </label>
                  <Input
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => handleChange('current_value', Number(e.target.value))}
                    required
                    placeholder="380000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loyer mensuel (€) *
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_rent}
                    onChange={(e) => handleChange('monthly_rent', Number(e.target.value))}
                    required
                    placeholder="1800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frais de notaire (€)
                  </label>
                  <Input
                    type="number"
                    value={formData.notary_fees}
                    onChange={(e) => handleChange('notary_fees', Number(e.target.value))}
                    placeholder="22400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coût des travaux (€)
                  </label>
                  <Input
                    type="number"
                    value={formData.renovation_cost}
                    onChange={(e) => handleChange('renovation_cost', Number(e.target.value))}
                    placeholder="15000"
                  />
                </div>
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