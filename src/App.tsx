import { useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DependenciesProvider } from '@/contexts/DependenciesContext';
import { DownloadProvider, useDownload } from '@/contexts/DownloadContext';
import { UpdaterProvider, useUpdater } from '@/contexts/UpdaterContext';
import { MainLayout } from '@/components/layout';
import type { Page } from '@/components/layout';
import { DownloadPage, SettingsPage } from '@/pages';
import { UpdateDialog } from '@/components/UpdateDialog';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('download');
  const updater = useUpdater();

  return (
    <>
      <MainLayout currentPage={currentPage} onPageChange={setCurrentPage}>
        {currentPage === 'download' && <DownloadPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </MainLayout>
      
      <UpdateDialog
        status={updater.status}
        updateInfo={updater.updateInfo}
        progress={updater.progress}
        error={updater.error}
        onDownload={updater.downloadAndInstall}
        onRestart={updater.restartApp}
        onDismiss={updater.dismissUpdate}
        onRetry={updater.checkForUpdate}
      />
    </>
  );
}

// Wrapper to get settings and pass to UpdaterProvider
function UpdaterWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useDownload();
  
  return (
    <UpdaterProvider autoCheck={settings.autoCheckUpdate}>
      {children}
    </UpdaterProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <DependenciesProvider>
        <DownloadProvider>
          <UpdaterWrapper>
            <AppContent />
          </UpdaterWrapper>
        </DownloadProvider>
      </DependenciesProvider>
    </ThemeProvider>
  );
}

export default App;
