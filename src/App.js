import React from 'react';
import { Header, FolderDetailsCard, TaskDetailsCard, ActionsCard, useFolderDetails } from './components';

const App = () => {
  const { taskDetails, loading, refetch } = useFolderDetails();

  return (
    <sp-theme theme="spectrum" scale="medium" color="dark">
      <div className="app">
        <Header />
        <div className="content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-label">Loading task details...</div>
              <sp-progress-bar indeterminate></sp-progress-bar>
            </div>
          ) : (
            <>
              <FolderDetailsCard taskDetails={taskDetails} loading={loading} onRefresh={refetch} />
              <div style={{ marginTop: '16px' }}>
                <TaskDetailsCard taskDetails={taskDetails} loading={loading} />
              </div>
              <div style={{ marginTop: '16px' }}>
                <ActionsCard />
              </div>
            </>
          )}
        </div>
      </div>
    </sp-theme>
  );
};

export default App;
