import React from 'react';
import { Header, FolderDetailsCard, ActionsCard, useFolderDetails } from './components';

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
