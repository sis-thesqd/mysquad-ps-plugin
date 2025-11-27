import React, { useState, useEffect, useRef } from 'react';
import {
  Header,
  TabNavigation,
  FolderDetailsCard,
  TaskDetailsCard,
  ActionsCard,
  ArtboardGeneratorTab,
  useFolderDetails,
} from './components';
import { config } from './config';

const MIN_LOADING_DISPLAY_TIME = 2000; // 2 seconds minimum

const App = () => {
  const [activeTab, setActiveTab] = useState('task');
  const { taskDetails, loading, refetch } = useFolderDetails();
  const [progress, setProgress] = useState(0);
  const [showLoading, setShowLoading] = useState(false);
  const loadingStartTime = useRef(null);

  useEffect(() => {
    let progressInterval;
    let minTimeTimeout;

    if (loading) {
      // Start loading display
      setShowLoading(true);
      setProgress(0);
      loadingStartTime.current = Date.now();

      // Animate progress from 0 to 90 over ~2 seconds
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90; // Cap at 90% until actually done
          // Ease out - slower as we approach 90
          const increment = Math.max(1, (90 - prev) / 10);
          return Math.min(90, prev + increment);
        });
      }, 100);
    } else if (loadingStartTime.current) {
      // Loading finished - ensure minimum display time
      const elapsed = Date.now() - loadingStartTime.current;
      const remainingTime = Math.max(0, MIN_LOADING_DISPLAY_TIME - elapsed);

      // Jump to 100%
      setProgress(100);

      // Hide after minimum time
      minTimeTimeout = setTimeout(() => {
        setShowLoading(false);
        setProgress(0);
        loadingStartTime.current = null;
      }, remainingTime + 300); // +300ms to show 100% briefly
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (minTimeTimeout) clearTimeout(minTimeTimeout);
    };
  }, [loading]);

  return (
    <sp-theme theme="spectrum" scale="medium" color="dark">
      <div className="app">
        <div className="app-header-row">
          <Header />
          <TabNavigation tabs={config.tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div className="content">
          {activeTab === 'task' && (
            <>
              {showLoading ? (
                <div className="loading-container">
                  <sp-progressbar max="100" value={progress}>
                    <sp-label slot="label">Loading task details...</sp-label>
                  </sp-progressbar>
                </div>
              ) : (
                <>
                  <FolderDetailsCard taskDetails={taskDetails} loading={loading} onRefresh={refetch} />
                  <div style={{ marginTop: '16px' }}>
                    <TaskDetailsCard taskDetails={taskDetails} loading={loading} />
                  </div>
                  {config.features.actionsCard && (
                    <div style={{ marginTop: '16px' }}>
                      <ActionsCard />
                    </div>
                  )}
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
