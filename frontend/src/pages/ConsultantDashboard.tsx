import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  FileText,
  Users,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';
import { learningAPI } from '../services/api';

interface CourseMaterial {
  id: number;
  title: string;
  description: string;
  content: string;
  category: string;
  difficulty_level: string;
  author_id: number;
  author_name: string;
  is_published: boolean;
  created_at: string;
}

interface Category {
  categories: string[];
  difficulty_levels: string[];
}

const ConsultantDashboard: React.FC = () => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [categories, setCategories] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    difficulty_level: 'beginner',
    is_published: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsResponse, categoriesResponse] = await Promise.all([
        learningAPI.getMyCourseMaterials(),
        learningAPI.getCategories()
      ]);
      setMaterials(materialsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error loading consultant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async () => {
    try {
      await learningAPI.createCourseMaterial(formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        content: '',
        category: '',
        difficulty_level: 'beginner',
        is_published: false
      });
      loadData();
    } catch (error) {
      console.error('Error creating material:', error);
    }
  };

  const handleUpdateMaterial = async () => {
    if (!selectedMaterial) return;
    
    try {
      await learningAPI.updateCourseMaterial(selectedMaterial.id, formData);
      setShowEditModal(false);
      setSelectedMaterial(null);
      setFormData({
        title: '',
        description: '',
        content: '',
        category: '',
        difficulty_level: 'beginner',
        is_published: false
      });
      loadData();
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm('Are you sure you want to delete this course material?')) return;
    
    try {
      await learningAPI.deleteCourseMaterial(materialId);
      setMaterials(materials.filter(material => material.id !== materialId));
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handlePublishMaterial = async (materialId: number, publish: boolean) => {
    try {
      await learningAPI.updateCourseMaterial(materialId, { is_published: publish });
      setMaterials(materials.map(material => 
        material.id === materialId 
          ? { ...material, is_published: publish }
          : material
      ));
    } catch (error) {
      console.error('Error updating material status:', error);
    }
  };

  const handleEditMaterial = (material: CourseMaterial) => {
    setSelectedMaterial(material);
    setFormData({
      title: material.title,
      description: material.description || '',
      content: material.content,
      category: material.category,
      difficulty_level: material.difficulty_level,
      is_published: material.is_published
    });
    setShowEditModal(true);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || material.difficulty_level === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
      'bg-pink-100 text-pink-800',
      'bg-orange-100 text-orange-800',
      'bg-teal-100 text-teal-800'
    ];
    const index = category.length % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultant dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultant Dashboard</h1>
          <p className="text-gray-600">Create and manage educational content for farmers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Materials</p>
                <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {materials.filter(m => m.is_published).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">
                  {materials.filter(m => !m.is_published).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Materials Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Course Materials</h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {categories && (
                  <>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      {categories.categories.map(category => (
                        <option key={category} value={category}>
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Levels</option>
                      {categories.difficulty_levels.map(level => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Material
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {material.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {material.description || 'No description'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(material.category)}`}>
                        {material.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(material.difficulty_level)}`}>
                        {material.difficulty_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        material.is_published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {material.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(material.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Edit material"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handlePublishMaterial(material.id, !material.is_published)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                            material.is_published 
                              ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                          title={material.is_published ? 'Unpublish material' : 'Publish material'}
                        >
                          {material.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Material Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Course Material</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter material title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter material description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {categories?.categories.map(category => (
                        <option key={category} value={category}>
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={formData.difficulty_level}
                      onChange={(e) => setFormData({...formData, difficulty_level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories?.difficulty_levels.map(level => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                    Publish immediately (make available to farmers)
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter course material content..."
                    rows={8}
                  />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    title: '',
                    description: '',
                    content: '',
                    category: '',
                    difficulty_level: 'beginner',
                    is_published: false
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMaterial}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {showEditModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Course Material</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories?.categories.map(category => (
                        <option key={category} value={category}>
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={formData.difficulty_level}
                      onChange={(e) => setFormData({...formData, difficulty_level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories?.difficulty_levels.map(level => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit_is_published" className="ml-2 block text-sm text-gray-900">
                    Publish material (make available to farmers)
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={8}
                  />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedMaterial(null);
                  setFormData({
                    title: '',
                    description: '',
                    content: '',
                    category: '',
                    difficulty_level: 'beginner',
                    is_published: false
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMaterial}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantDashboard; 