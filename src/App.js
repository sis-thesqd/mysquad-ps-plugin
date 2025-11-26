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
        <div className="app-header-row">
          <Header />
          <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div className="content">
          {activeTab === 'task' && (
            <>
              {loading ? (
                <div className="loading-container">
                  <sp-progressbar max="100" value="0">
                    <sp-label slot="label">Loading task details...</sp-label>
                  </sp-progressbar>
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
