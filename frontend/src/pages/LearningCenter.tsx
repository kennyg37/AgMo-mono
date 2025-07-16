import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter,
  Eye,
  Clock,
  User,
  Star,
  ChevronRight,
  Play,
  FileText,
  GraduationCap,
  Shield,
  Leaf,
  Droplets,
  Scissors,
  TreePine,
  Smartphone,
  BarChart3
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

const LearningCenter: React.FC = () => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [categories, setCategories] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsResponse, categoriesResponse] = await Promise.all([
        learningAPI.getCourseMaterials(),
        learningAPI.getCategories()
      ]);
      setMaterials(materialsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error loading learning materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMaterial = (material: CourseMaterial) => {
    setSelectedMaterial(material);
    setShowMaterialModal(true);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'crop_management': return <GraduationCap className="w-5 h-5" />;
      case 'pest_control': return <Shield className="w-5 h-5" />;
      case 'soil_health': return <Leaf className="w-5 h-5" />;
      case 'irrigation': return <Droplets className="w-5 h-5" />;
      case 'harvesting': return <Scissors className="w-5 h-5" />;
      case 'sustainable_farming': return <TreePine className="w-5 h-5" />;
      case 'technology': return <Smartphone className="w-5 h-5" />;
      case 'business_management': return <BarChart3 className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading learning center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Learning Center</h1>
              <p className="text-gray-600">Expand your agricultural knowledge with expert-curated materials</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for topics, techniques, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            {categories && (
              <>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${getCategoryColor(material.category)}`}>
                      {getCategoryIcon(material.category)}
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(material.difficulty_level)}`}>
                      {material.difficulty_level}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(material.category)}`}>
                    {material.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {material.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {material.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span>{material.author_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{new Date(material.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleViewMaterial(material)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Material
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-600">Try adjusting your search or filters to find relevant content.</p>
          </div>
        )}
      </div>

      {/* Material View Modal */}
      {showMaterialModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${getCategoryColor(selectedMaterial.category)}`}>
                    {getCategoryIcon(selectedMaterial.category)}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMaterial.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(selectedMaterial.difficulty_level)}`}>
                        {selectedMaterial.difficulty_level}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(selectedMaterial.category)}`}>
                        {selectedMaterial.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMaterialModal(false);
                    setSelectedMaterial(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-900">{selectedMaterial.description || 'No description available'}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-900">{selectedMaterial.content}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>By {selectedMaterial.author_name}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Published {new Date(selectedMaterial.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningCenter; 