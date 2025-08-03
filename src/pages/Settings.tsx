import React, { useState } from 'react';
import { useProperties, useUpdateProperty } from '@/api/dataHooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Copy, Check, Edit3, Save, X, Link, ExternalLink, Shield, Globe } from 'lucide-react';

const Settings: React.FC = () => {
  const { data: properties = [], isLoading } = useProperties();
  const updateProperty = useUpdateProperty();
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [tempUrls, setTempUrls] = useState<{ [key: string]: { airbnb: string; booking: string } }>({});
  const [copiedLinks, setCopiedLinks] = useState<{ [key: string]: boolean }>({});

  // Generate channel manager webhook URL for each property
  const generateChannelManagerUrl = (propertyId: string) => {
    const baseUrl = import.meta.env.VITE_ICS_WEBHOOK_BASE || 'https://hook.eu2.make.com/1p4gelkvs573a5au5sngbc2jtlvmou9d';
    return `${baseUrl}?property_id=${propertyId}`;
  };

  const handleCopyChannelManagerLink = async (propertyId: string) => {
    const url = generateChannelManagerUrl(propertyId);
    await navigator.clipboard.writeText(url);
    setCopiedLinks(prev => ({ ...prev, [propertyId]: true }));
    setTimeout(() => {
      setCopiedLinks(prev => ({ ...prev, [propertyId]: false }));
    }, 2000);
  };

  const handleEditProperty = (property: any) => {
    setEditingProperty(property.id);
    setTempUrls(prev => ({
      ...prev,
      [property.id]: {
        airbnb: property.airbnb_ical || '',
        booking: property.booking_ical || ''
      }
    }));
  };

  const handleSaveProperty = async (propertyId: string) => {
    const urls = tempUrls[propertyId];
    if (!urls) return;

    try {
      await updateProperty.mutateAsync({
        id: propertyId,
        airbnb_ical: urls.airbnb || null,
        booking_ical: urls.booking || null
      });
      setEditingProperty(null);
      setTempUrls(prev => {
        const updated = { ...prev };
        delete updated[propertyId];
        return updated;
      });
    } catch (error) {
      console.error('Failed to update property:', error);
    }
  };

  const handleCancelEdit = (propertyId: string) => {
    setEditingProperty(null);
    setTempUrls(prev => {
      const updated = { ...prev };
      delete updated[propertyId];
      return updated;
    });
  };

  const updateTempUrl = (propertyId: string, type: 'airbnb' | 'booking', value: string) => {
    setTempUrls(prev => ({
      ...prev,
      [propertyId]: {
        ...prev[propertyId],
        [type]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading channel manager settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Channel Manager</h1>
        <p className="text-gray-600 text-lg">Manage your property integrations and OTA connections</p>
      </div>



      {/* Properties Integration Settings */}
      <div className="space-y-6">
        {properties.length > 0 ? (
          properties.map((property, index) => (
            <motion.div
              key={property.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {/* Property Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{property.name}</h3>
                      <p className="text-gray-600 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {property.location}
                      </p>
                    </div>
                  </div>
                  
                  {editingProperty === property.id ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSaveProperty(property.id)}
                        disabled={updateProperty.isPending}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProperty.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => handleCancelEdit(property.id)}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditProperty(property)}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Connections
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8">
                {/* Channel Manager Feed URL */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Link className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Channel Manager Feed URL</h4>
                      <p className="text-sm text-gray-600">Paste this URL into your OTA platforms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={generateChannelManagerUrl(property.id)}
                        readOnly
                        className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-xl text-gray-700 font-mono text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Shield className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyChannelManagerLink(property.id)}
                      className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      title="Copy channel manager feed URL"
                    >
                      {copiedLinks[property.id] ? 
                        <Check className="w-5 h-5" /> : 
                        <Copy className="w-5 h-5" />
                      }
                    </button>
                  </div>
                </div>

                {/* OTA Connection URLs */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Airbnb */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Airbnb Integration</h4>
                        <p className="text-sm text-gray-600">Export calendar from Airbnb</p>
                      </div>
                    </div>
                    
                    {editingProperty === property.id ? (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={tempUrls[property.id]?.airbnb || ''}
                          onChange={(e) => updateTempUrl(property.id, 'airbnb', e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                          placeholder="https://www.airbnb.com/calendar/ical/..."
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={property.airbnb_ical || 'Not connected'}
                            readOnly
                            className={`w-full p-4 rounded-xl border text-sm transition-all duration-200 ${
                              property.airbnb_ical 
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800' 
                                : 'bg-gray-50 border-gray-300 text-gray-500'
                            }`}
                          />
                        </div>
                        {property.airbnb_ical && (
                          <a
                            href={property.airbnb_ical}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            title="Open Airbnb calendar URL"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Booking.com */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-sm">B</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Booking.com Integration</h4>
                        <p className="text-sm text-gray-600">Export calendar from Booking.com</p>
                      </div>
                    </div>
                    
                    {editingProperty === property.id ? (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={tempUrls[property.id]?.booking || ''}
                          onChange={(e) => updateTempUrl(property.id, 'booking', e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="https://admin.booking.com/calendar.ical?..."
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={property.booking_ical || 'Not connected'}
                            readOnly
                            className={`w-full p-4 rounded-xl border text-sm transition-all duration-200 ${
                              property.booking_ical 
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800' 
                                : 'bg-gray-50 border-gray-300 text-gray-500'
                            }`}
                          />
                        </div>
                        {property.booking_ical && (
                          <a
                            href={property.booking_ical}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            title="Open Booking.com calendar URL"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Status Dashboard */}
                <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Connection Status
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                      <span className="text-gray-700 font-medium">Airbnb</span>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        property.airbnb_ical 
                          ? 'bg-green-100 text-green-800 shadow-sm' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {property.airbnb_ical ? '🟢 Connected' : '🔴 Not Connected'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                      <span className="text-gray-700 font-medium">Booking.com</span>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        property.booking_ical 
                          ? 'bg-green-100 text-green-800 shadow-sm' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {property.booking_ical ? '🟢 Connected' : '🔴 Not Connected'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Properties Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Add properties from the Dashboard to start managing their channel integrations and OTA connections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;