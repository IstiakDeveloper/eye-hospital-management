import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Plus, Edit, Trash2, Search, X, Save, Beaker, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';

interface MedicalTest {
  id: number;
  name: string;
  code: string;
  category: string;
  price: number;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

interface Props {
  tests: MedicalTest[];
  categories: Record<string, string>;
}

export default function TestIndex({ tests, categories }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<MedicalTest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Laboratory',
    price: '',
    description: '',
    duration_minutes: '30',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || test.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = () => {
    setEditingTest(null);
    setFormData({
      name: '',
      code: '',
      category: 'Laboratory',
      price: '',
      description: '',
      duration_minutes: '30',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (test: MedicalTest) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      code: test.code,
      category: test.category,
      price: test.price.toString(),
      description: test.description || '',
      duration_minutes: test.duration_minutes.toString(),
      is_active: test.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = editingTest
      ? `/medical-tests/tests/${editingTest.id}`
      : '/medical-tests/tests';

    const method = editingTest ? 'put' : 'post';

    router[method](url, formData, {
      onSuccess: () => {
        setShowModal(false);
        setEditingTest(null);
      },
      onFinish: () => setLoading(false)
    });
  };

  const handleDelete = (test: MedicalTest) => {
    if (!confirm(`Are you sure you want to delete "${test.name}"?`)) return;
    router.delete(`/medical-tests/tests/${test.id}`);
  };

  const toggleActive = (test: MedicalTest) => {
    router.put(`/medical-tests/tests/${test.id}`, {
      ...test,
      is_active: !test.is_active
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medical Tests Master</h1>
              <p className="text-gray-600 mt-1">Manage all medical test types</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add New Test
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tests</p>
                  <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
                </div>
                <Beaker className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Tests</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tests.filter(t => t.is_active).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive Tests</p>
                  <p className="text-2xl font-bold text-red-600">
                    {tests.filter(t => !t.is_active).length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Object.keys(categories).length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or code..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {Object.entries(categories).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Test Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Duration</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <Beaker className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-lg font-medium">No tests found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map(test => (
                      <tr key={test.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{test.name}</div>
                            {test.description && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-1">{test.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {test.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{test.category}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-semibold text-blue-600">
                            ৳{Number(test.price).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {test.duration_minutes} min
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleActive(test)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                              test.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {test.is_active ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(test)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(test)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTest ? 'Edit Test' : 'Add New Test'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.entries(categories).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (৳) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional test description..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active (available for booking)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : editingTest ? 'Update Test' : 'Create Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
