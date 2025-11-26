import React from 'react';
import Header from './components/Header';
import FolderDetailsCard from './features/folder-details/components/FolderDetailsCard';
import ActionsCard from './features/actions/components/ActionsCard';
import { useFolderDetails } from './features/folder-details/hooks/useFolderDetails';

const App = () => {
  const { taskDetails, loading, refetch } = useFolderDetails();

  return (
    <sp-theme theme="spectrum" scale="medium" color="dark">
      <div className="app">
        <Header />
        <div className="content">
          <FolderDetailsCard taskDetails={taskDetails} loading={loading} onRefresh={refetch} />
          <div style={{ marginTop: '16px' }}>
            <ActionsCard />
          </div>
        </div>
      </div>
    </sp-theme>
  );
};

export default App;
