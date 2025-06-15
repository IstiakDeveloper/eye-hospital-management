// resources/js/Pages/VisionTests/Create.tsx
import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateAge } from '@/lib/utils';
import {
  Save,
  X,
  FileText,
  Eye,
  AlertCircle,
  User,
  Activity,
  Settings,
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';

interface Patient {
  id: number;
  patient_id: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
}

interface LatestTest {
  id: number;
  right_eye_vision: string | null;
  left_eye_vision: string | null;
  right_eye_power: number | null;
  left_eye_power: number | null;
  right_eye_pressure: string | null;
  left_eye_pressure: string | null;
  right_eye_sphere: number | null;
  left_eye_sphere: number | null;
  right_eye_cylinder: number | null;
  left_eye_cylinder: number | null;
  right_eye_axis: number | null;
  left_eye_axis: number | null;
  additional_notes: string | null;
  test_date: string;
}

interface VisionTestCreateProps {
  patient: Patient;
  latestTest: LatestTest | null;
}

const STEPS = [
  { id: 'vision', title: 'Vision', icon: Eye },
  { id: 'power', title: 'Power', icon: Settings },
  { id: 'pressure', title: 'Pressure', icon: Activity },
  { id: 'notes', title: 'Notes', icon: FileText }
];

export default function VisionTestCreate({ patient, latestTest }: VisionTestCreateProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const { data, setData, post, processing, errors } = useForm({
    right_eye_vision: latestTest?.right_eye_vision || '',
    left_eye_vision: latestTest?.left_eye_vision || '',
    right_eye_power: latestTest?.right_eye_power?.toString() || '',
    left_eye_power: latestTest?.left_eye_power?.toString() || '',
    right_eye_pressure: latestTest?.right_eye_pressure || '',
    left_eye_pressure: latestTest?.left_eye_pressure || '',
    right_eye_sphere: latestTest?.right_eye_sphere?.toString() || '',
    left_eye_sphere: latestTest?.left_eye_sphere?.toString() || '',
    right_eye_cylinder: latestTest?.right_eye_cylinder?.toString() || '',
    left_eye_cylinder: latestTest?.left_eye_cylinder?.toString() || '',
    right_eye_axis: latestTest?.right_eye_axis?.toString() || '',
    left_eye_axis: latestTest?.left_eye_axis?.toString() || '',
    additional_notes: latestTest?.additional_notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('visiontests.store', patient.id));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepCompleted = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Vision
        return data.right_eye_vision || data.left_eye_vision;
      case 1: // Power
        return data.right_eye_sphere || data.left_eye_sphere || data.right_eye_power || data.left_eye_power;
      case 2: // Pressure
        return data.right_eye_pressure || data.left_eye_pressure;
      case 3: // Notes
        return false; // Notes step should not auto-complete
      default:
        return false;
    }
  };

  const commonVisionValues = ['6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60'];
  const commonPressureValues = ['10', '12', '14', '16', '18', '20', '22'];

  const QuickSelectButton = ({ value, onClick, current }: { value: string; onClick: () => void; current: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded-md border transition-all ${
        current === value
          ? 'bg-blue-500 text-white border-blue-500'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
      }`}
    >
      {value}
    </button>
  );

  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep || isStepCompleted(index);

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                  ${isActive
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }
                `}>
                  {isCompleted && !isActive ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-4 transition-all
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStepContent = () => {
    const currentStepId = STEPS[currentStep].id;

    switch (currentStepId) {
      case 'vision':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Right Eye */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-red-700 flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Right Eye (OD)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vision Acuity
                  </label>
                  <Input
                    value={data.right_eye_vision}
                    onChange={(e) => setData('right_eye_vision', e.target.value)}
                    error={errors.right_eye_vision}
                    placeholder="e.g., 6/6"
                    className="mb-2"
                  />
                  <div className="flex flex-wrap gap-1">
                    {commonVisionValues.map(value => (
                      <QuickSelectButton
                        key={value}
                        value={value}
                        current={data.right_eye_vision}
                        onClick={() => setData('right_eye_vision', value)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Left Eye */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-blue-700 flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Left Eye (OS)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vision Acuity
                  </label>
                  <Input
                    value={data.left_eye_vision}
                    onChange={(e) => setData('left_eye_vision', e.target.value)}
                    error={errors.left_eye_vision}
                    placeholder="e.g., 6/6"
                    className="mb-2"
                  />
                  <div className="flex flex-wrap gap-1">
                    {commonVisionValues.map(value => (
                      <QuickSelectButton
                        key={value}
                        value={value}
                        current={data.left_eye_vision}
                        onClick={() => setData('left_eye_vision', value)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'power':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Right Eye Power */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-700 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Right Eye (OD) - Refraction</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sphere (SPH)
                    </label>
                    <Input
                      type="number"
                      step="0.25"
                      value={data.right_eye_sphere}
                      onChange={(e) => setData('right_eye_sphere', e.target.value)}
                      error={errors.right_eye_sphere}
                      placeholder="e.g., -1.25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cylinder (CYL)
                    </label>
                    <Input
                      type="number"
                      step="0.25"
                      value={data.right_eye_cylinder}
                      onChange={(e) => setData('right_eye_cylinder', e.target.value)}
                      error={errors.right_eye_cylinder}
                      placeholder="e.g., -0.75"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Axis (°)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={data.right_eye_axis}
                    onChange={(e) => setData('right_eye_axis', e.target.value)}
                    error={errors.right_eye_axis}
                    placeholder="e.g., 90"
                  />
                </div>
                <div className="pt-2 border-t border-red-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Legacy Power (Optional)
                  </label>
                  <Input
                    type="number"
                    step="0.25"
                    value={data.right_eye_power}
                    onChange={(e) => setData('right_eye_power', e.target.value)}
                    error={errors.right_eye_power}
                    placeholder="e.g., -1.25"
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Left Eye Power */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-700 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Left Eye (OS) - Refraction</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sphere (SPH)
                    </label>
                    <Input
                      type="number"
                      step="0.25"
                      value={data.left_eye_sphere}
                      onChange={(e) => setData('left_eye_sphere', e.target.value)}
                      error={errors.left_eye_sphere}
                      placeholder="e.g., -1.25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cylinder (CYL)
                    </label>
                    <Input
                      type="number"
                      step="0.25"
                      value={data.left_eye_cylinder}
                      onChange={(e) => setData('left_eye_cylinder', e.target.value)}
                      error={errors.left_eye_cylinder}
                      placeholder="e.g., -0.75"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Axis (°)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={data.left_eye_axis}
                    onChange={(e) => setData('left_eye_axis', e.target.value)}
                    error={errors.left_eye_axis}
                    placeholder="e.g., 90"
                  />
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Legacy Power (Optional)
                  </label>
                  <Input
                    type="number"
                    step="0.25"
                    value={data.left_eye_power}
                    onChange={(e) => setData('left_eye_power', e.target.value)}
                    error={errors.left_eye_power}
                    placeholder="e.g., -1.25"
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'pressure':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-700 flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Right Eye (OD) - IOP</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intraocular Pressure
                  </label>
                  <Input
                    value={data.right_eye_pressure}
                    onChange={(e) => setData('right_eye_pressure', e.target.value)}
                    error={errors.right_eye_pressure}
                    placeholder="e.g., 14 mmHg"
                    className="mb-2"
                  />
                  <div className="flex flex-wrap gap-1">
                    {commonPressureValues.map(value => (
                      <QuickSelectButton
                        key={value}
                        value={`${value} mmHg`}
                        current={data.right_eye_pressure}
                        onClick={() => setData('right_eye_pressure', `${value} mmHg`)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-700 flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Left Eye (OS) - IOP</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intraocular Pressure
                  </label>
                  <Input
                    value={data.left_eye_pressure}
                    onChange={(e) => setData('left_eye_pressure', e.target.value)}
                    error={errors.left_eye_pressure}
                    placeholder="e.g., 14 mmHg"
                    className="mb-2"
                  />
                  <div className="flex flex-wrap gap-1">
                    {commonPressureValues.map(value => (
                      <QuickSelectButton
                        key={value}
                        value={`${value} mmHg`}
                        current={data.left_eye_pressure}
                        onClick={() => setData('left_eye_pressure', `${value} mmHg`)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'notes':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span>Additional Notes & Observations</span>
              </CardTitle>
              <CardDescription>
                Record any additional findings, recommendations, or observations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={data.additional_notes}
                onChange={(e) => setData('additional_notes', e.target.value)}
                rows={8}
                className={`
                  block w-full rounded-lg border border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                  resize-none p-4
                  ${errors.additional_notes ? 'border-red-500 focus:ring-red-500' : ''}
                `}
                placeholder="Enter any additional observations, recommendations, or notes about the vision test..."
              />
              {errors.additional_notes && (
                <p className="mt-2 text-sm text-red-600">{errors.additional_notes}</p>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Record Vision Test">
      <Head title="Record Vision Test" />

      {/* Patient Info Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
                <Badge variant="outline" className="bg-white">ID: {patient.patient_id}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {patient.date_of_birth && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Age: {calculateAge(patient.date_of_birth)} years</span>
                  </div>
                )}
                {patient.gender && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Gender: {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</span>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">📞 {patient.phone}</span>
                  </div>
                )}
                {latestTest && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Last Test: {new Date(latestTest.test_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {latestTest && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Previous test results are pre-filled for your reference</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator />

      {/* Main Form */}
      <Card className="max-w-6xl mx-auto shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-2xl flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <span>Vision Test Recording - Step {currentStep + 1} of {STEPS.length}</span>
          </CardTitle>
          <CardDescription className="text-base">
            {STEPS[currentStep].title} Assessment
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>

          <CardFooter className="bg-gray-50 border-t px-8 py-6">
            <div className="flex justify-between items-center w-full">
              <Button
                type="button"
                variant="outline"
                className="flex items-center space-x-2"
                onClick={() => window.history.back()}
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>

              <div className="flex items-center space-x-4">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex items-center space-x-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                )}

                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={processing}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Vision Test</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Quick Tips */}
      <div className="mt-8 max-w-6xl mx-auto">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 mb-2">Quick Tips - {STEPS[currentStep].title}</h3>
                <div className="text-sm text-amber-700 space-y-1">
                  {currentStep === 0 && (
                    <>
                      <p>• Use the quick-select buttons for common vision values</p>
                      <p>• 6/6 vision is considered normal/perfect vision</p>
                      <p>• Higher denominators indicate poorer vision (e.g., 6/60)</p>
                    </>
                  )}
                  {currentStep === 1 && (
                    <>
                      <p>• SPH: Positive values for farsightedness, negative for nearsightedness</p>
                      <p>• CYL: Cylinder values for astigmatism correction</p>
                      <p>• Axis: Direction of astigmatism (0-180 degrees)</p>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <p>• Normal IOP range: 10-21 mmHg</p>
                      <p>• Values above 21 mmHg may indicate glaucoma risk</p>
                      <p>• Use the quick-select buttons for common pressure values</p>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <p>• Document any unusual findings or patient complaints</p>
                      <p>• Include recommendations for follow-up if needed</p>
                      <p>• Notes help track patient progress over time</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
