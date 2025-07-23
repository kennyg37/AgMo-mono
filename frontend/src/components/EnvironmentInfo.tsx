import React from 'react';
import { environment } from '../config/environment';

const EnvironmentInfo: React.FC = () => {
  if (!environment.enableDebugMode) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg text-xs opacity-75 hover:opacity-100 transition-opacity">
      <div className="space-y-1">
        <div>Environment: {environment.isDevelopment ? 'Development' : 'Production'}</div>
        <div>API: {environment.apiUrl}</div>
        <div>Frontend: {environment.frontendUrl}</div>
        <div>Version: {environment.version}</div>
        <div>Build: {new Date(environment.buildDate).toLocaleDateString()}</div>
      </div>
    </div>
  );
};

export default EnvironmentInfo; 