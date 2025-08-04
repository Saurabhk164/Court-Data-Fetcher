import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { Search, Download, Calendar, User, FileText, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

const CaseSearch = () => {
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  // Case types for Delhi High Court
  const caseTypes = [
    { value: 'FAO', label: 'FAO - First Appeal from Order' },
    { value: 'CWP', label: 'CWP - Civil Writ Petition' },
    { value: 'CRL', label: 'CRL - Criminal' },
    { value: 'LPA', label: 'LPA - Letters Patent Appeal' },
    { value: 'RFA', label: 'RFA - Regular First Appeal' },
    { value: 'CM', label: 'CM - Civil Miscellaneous' },
    { value: 'CRL.M.C.', label: 'CRL.M.C. - Criminal Miscellaneous' },
    { value: 'W.P.(C)', label: 'W.P.(C) - Writ Petition (Civil)' },
    { value: 'W.P.(CRL)', label: 'W.P.(CRL) - Writ Petition (Criminal)' }
  ];

  // Generate years for filing year dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const searchMutation = useMutation(
    async (data) => {
      setIsLoading(true);
      const response = await axios.post('/api/case', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setSearchResult(data.data);
        toast.success('Case information retrieved successfully!');
      },
      onError: (error) => {
        const message = error.response?.data?.error?.message || 'Failed to fetch case information';
        toast.error(message);
        setSearchResult(null);
      },
      onSettled: () => {
        setIsLoading(false);
      }
    }
  );

  const onSubmit = (data) => {
    searchMutation.mutate(data);
  };

  const handleDownload = (url, title) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Search className="w-6 h-6 mr-2" />
          Search Court Case
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Case Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Type *
              </label>
              <select
                {...register('caseType', { required: 'Case type is required' })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.caseType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Case Type</option>
                {caseTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.caseType && (
                <p className="mt-1 text-sm text-red-600">{errors.caseType.message}</p>
              )}
            </div>

            {/* Case Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Number *
              </label>
              <input
                type="text"
                {...register('caseNumber', {
                  required: 'Case number is required',
                  pattern: {
                    value: /^[0-9]+$/,
                    message: 'Case number must contain only numbers'
                  }
                })}
                placeholder="e.g., 12345"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.caseNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.caseNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.caseNumber.message}</p>
              )}
            </div>

            {/* Filing Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filing Year *
              </label>
              <select
                {...register('filingYear', {
                  required: 'Filing year is required',
                  valueAsNumber: true
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.filingYear ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.filingYear && (
                <p className="mt-1 text-sm text-red-600">{errors.filingYear.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Case
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchResult && (
        <div className="bg-white rounded-lg shadow-md p-6 fade-in">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Case Information</h3>
          
          {/* Case Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Case Number</p>
                  <p className="font-medium">{searchResult.caseInfo.caseNumber || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Case Type</p>
                  <p className="font-medium">{searchResult.caseInfo.caseType || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Filing Date</p>
                  <p className="font-medium">{searchResult.caseInfo.filingDate || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Petitioner</p>
                  <p className="font-medium">{searchResult.caseInfo.petitioner || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Respondent</p>
                  <p className="font-medium">{searchResult.caseInfo.respondent || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Next Hearing</p>
                  <p className="font-medium">{searchResult.caseInfo.nextHearingDate || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders and Judgments */}
          {searchResult.orders && searchResult.orders.length > 0 ? (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders & Judgments</h4>
              <div className="space-y-3">
                {searchResult.orders.map((order, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{order.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          Date: {order.date || 'N/A'} | Type: {order.type}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(order.url, order.title)}
                        className="ml-4 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center text-sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders or judgments found for this case.</p>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {searchMutation.isError && !searchResult && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Search Failed</h3>
          </div>
          <p className="mt-2 text-red-700">
            {searchMutation.error?.response?.data?.error?.message || 'An error occurred while searching for the case.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CaseSearch; 