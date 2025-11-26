import React, { useState } from 'react';
import {
  Header,
  TabNavigation,
  FolderDetailsCard,
  TaskDetailsCard,
  ActionsCard,
  ArtboardGeneratorTab,
  useFolderDetails,
} from './components';

const TABS = [
  { id: 'task', label: 'Task Details' },
  { id: 'generator', label: 'Generator' },
];

const App = () => {
  const [activeTab, setActiveTab] = useState('task');
  const { taskDetails, loading, refetch } = useFolderDetails();

  return (
    <sp-theme theme="spectrum" scale="medium" color="dark">
      <div className="app">
        <Header />
        <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="content">
          {activeTab === 'task' && (
            <>
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
            </>
          )}

          {activeTab === 'generator' && (
            <ArtboardGeneratorTab />
          )}
        </div>
      </div>
    </sp-theme>
  );
};

export default App;
