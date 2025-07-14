import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  MapPin, 
  Sprout,
  Edit,
  Trash2,
  Search,
  Crop,
} from 'lucide-react';
import { farmsAPI } from '../services/api';

interface Farm {
  id: number;
  name: string;
  location: string;
  total_acres: number;
  active_fields: number;
  crop_types: string[];
  health_score: number;
  created_at: string;
  status: 'active' | 'inactive';
}

interface Field {
  id: number;
  name: string;
  farm_id: number;
  acres: number;
  crop_type: string;
  planting_date: string;
  expected_harvest: string;
  health_score: number;
  status: 'growing' | 'harvested' | 'fallow';
}

interface Crop {
  id: number;
  field_id: number;
  type: string;
  variety: string;
  planting_date: string;
  expected_harvest: string;
  health_score: number;
  yield_prediction: number;
  status: 'growing' | 'harvested' | 'failed';
}

const Farms: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null);
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  // Fetch farms
  const { data: farms, isLoading } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farmsAPI.getFarms(),
  });

  // Fetch fields for selected farm
  const { data: fields } = useQuery({
    queryKey: ['fields', selectedFarm],
    queryFn: () => selectedFarm ? farmsAPI.getFields(selectedFarm) : null,
    enabled: !!selectedFarm,
  });

  // Fetch crops for selected field
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const { data: crops } = useQuery({
    queryKey: ['crops', selectedField],
    queryFn: () => selectedField ? farmsAPI.getCrops(selectedField) : null,
    enabled: !!selectedField,
  });

  // Mutations
  const createFarmMutation = useMutation({
    mutationFn: (farmData: any) => farmsAPI.createFarm(farmData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      setShowAddFarm(false);
    },
  });

  const createFieldMutation = useMutation({
    mutationFn: ({ farmId, fieldData }: { farmId: number; fieldData: any }) =>
      farmsAPI.createField(farmId, fieldData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', selectedFarm] });
      setShowAddField(false);
    },
  });

  const createCropMutation = useMutation({
    mutationFn: ({ fieldId, cropData }: { fieldId: number; cropData: any }) =>
      farmsAPI.createCrop(fieldId, cropData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops', selectedField] });
    },
  });

  const deleteFarmMutation = useMutation({
    mutationFn: (farmId: number) => farmsAPI.deleteFarm(farmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
    },
  });

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'growing':
        return 'bg-green-100 text-green-800';
      case 'harvested':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
      case 'fallow':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCropIcon = (cropType: string) => {
    switch (cropType.toLowerCase()) {
      case 'corn':
        return <Crop className="w-5 h-5 text-yellow-600" />;
      case 'wheat':
        return <Crop className="w-5 h-5 text-amber-600" />;
      case 'soybean':
        return <Crop className="w-5 h-5 text-green-600" />;
      case 'cotton':
        return <Crop className="w-5 h-5 text-white-600" />;
      default:
        return <Sprout className="w-5 h-5 text-green-600" />;
    }
  };

  const filteredFarms = farms?.data?.filter((farm: Farm) => {
    const matchesSearch = farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farm.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || farm.status === filterStatus;
    return matchesSearch && matchesFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farms</h1>
          <p className="text-gray-600">Manage your farms, fields, and crops</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddFarm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Farm</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search farms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Farms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFarms.map((farm: Farm) => (
          <div
            key={farm.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedFarm(farm.id)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{farm.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{farm.location}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFarmMutation.mutate(farm.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{farm.total_acres}</p>
                  <p className="text-xs text-gray-600">Total Acres</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{farm.active_fields}</p>
                  <p className="text-xs text-gray-600">Active Fields</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Health Score</span>
                  <span className={`text-sm font-medium ${getHealthColor(farm.health_score)}`}>
                    {farm.health_score}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(farm.status)}`}>
                    {farm.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Crop Types</span>
                  <div className="flex space-x-1">
                    {farm.crop_types.slice(0, 3).map((crop, index) => (
                      <div key={index} className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ))}
                    {farm.crop_types.length > 3 && (
                      <span className="text-xs text-gray-500">+{farm.crop_types.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Farm Details */}
      {selectedFarm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {farms?.data?.find((f: Farm) => f.id === selectedFarm)?.name} - Fields
                </h2>
                <p className="text-sm text-gray-600">Manage fields and crops</p>
              </div>
              <button
                onClick={() => setShowAddField(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Field</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {fields?.data?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.data.map((field: Field) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedField(field.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{field.name}</h3>
                        <p className="text-sm text-gray-600">{field.acres} acres</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getCropIcon(field.crop_type)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Crop</span>
                        <span className="text-xs font-medium text-gray-900">{field.crop_type}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Health</span>
                        <span className={`text-xs font-medium ${getHealthColor(field.health_score)}`}>
                          {field.health_score}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Status</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(field.status)}`}>
                          {field.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Sprout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Fields Yet</h3>
                <p className="text-gray-600 mb-4">Add your first field to start tracking crops</p>
                <button
                  onClick={() => setShowAddField(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add First Field
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Field Crops */}
      {selectedField && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {fields?.data?.find((f: Field) => f.id === selectedField)?.name} - Crops
                </h2>
                <p className="text-sm text-gray-600">Current and historical crops</p>
              </div>
              <button
                onClick={() => {/* Add crop modal */}}
                className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Crop</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {crops?.data?.length > 0 ? (
              <div className="space-y-4">
                {crops.data.map((crop: Crop) => (
                  <div key={crop.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{crop.variety}</h3>
                        <p className="text-sm text-gray-600">{crop.type}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(crop.status)}`}>
                        {crop.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Health Score</p>
                        <p className={`text-sm font-medium ${getHealthColor(crop.health_score)}`}>
                          {crop.health_score}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Yield Prediction</p>
                        <p className="text-sm font-medium text-gray-900">{crop.yield_prediction}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Planted</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(crop.planting_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Expected Harvest</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(crop.expected_harvest).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Crop className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Crops Yet</h3>
                <p className="text-gray-600 mb-4">Add crops to start monitoring growth and health</p>
                <button
                  onClick={() => {/* Add crop modal */}}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add First Crop
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Farm Modal */}
      {showAddFarm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Farm</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createFarmMutation.mutate({
                name: formData.get('name'),
                location: formData.get('location'),
                total_acres: Number(formData.get('acres')),
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    name="location"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Acres</label>
                  <input
                    name="acres"
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddFarm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Farm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {showAddField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Field</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createFieldMutation.mutate({
                farmId: selectedFarm!,
                fieldData: {
                  name: formData.get('name'),
                  acres: Number(formData.get('acres')),
                  crop_type: formData.get('crop_type'),
                  planting_date: formData.get('planting_date'),
                  expected_harvest: formData.get('expected_harvest'),
                }
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acres</label>
                  <input
                    name="acres"
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
                  <select
                    name="crop_type"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select crop type</option>
                    <option value="corn">Corn</option>
                    <option value="wheat">Wheat</option>
                    <option value="soybean">Soybean</option>
                    <option value="cotton">Cotton</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date</label>
                  <input
                    name="planting_date"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Harvest</label>
                  <input
                    name="expected_harvest"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddField(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Farms; 