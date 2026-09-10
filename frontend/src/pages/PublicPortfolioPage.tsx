import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { ThemeEngine } from '../components/portfolio/ThemeEngine';
import { QrModal } from '../components/portfolio/QrModal';
import { ReviewModal } from '../components/portfolio/ReviewModal';
import { VerifiedDocumentsUnlockModal } from '../components/portfolio/VerifiedDocumentsUnlockModal';
import { ScheduleMeetingModal } from '../components/portfolio/ScheduleMeetingModal';
import { Spinner } from '../components/ui/Spinner';
import { ShieldAlert } from 'lucide-react';
import { extractSubdomainFromHostname, getPublicPortfolioDisplay, getPublicPortfolioUrl } from '../utils/url';

export const PublicPortfolioPage: React.FC = () => {
  const { subdomain: paramSubdomain } = useParams<{ subdomain: string }>();

  // Resolve subdomain from URL path or hostname (*.localhost or production domain)
  const hostSubdomain = extractSubdomainFromHostname(window.location.hostname);
  const activeSubdomain = paramSubdomain || hostSubdomain || 'francis';

  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isVerifiedDocsOpen, setIsVerifiedDocsOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<'all' | 'call'>('all');
  const [verifiedDocsInitialTab, setVerifiedDocsInitialTab] = useState<'unlock' | 'request'>('unlock');
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);
  const [resumeDownloadError, setResumeDownloadError] = useState('');

  const handleOpenVerifiedDocs = (tab: 'unlock' | 'request' = 'unlock') => {
    setVerifiedDocsInitialTab(tab);
    setIsVerifiedDocsOpen(true);
  };

  useEffect(() => {
    fetchPublicPortfolio();
    api.get('/public-settings')
      .then((res: any) => setGlobalSettings(res.data?.data || res.data))
      .catch(() => {});
  }, [activeSubdomain]);

  // Dynamically inject custom favicon, PWA manifest, and external analytics scripts
  useEffect(() => {
    if (!portfolioData) return;

    const customization = portfolioData.profile?.customization;
    const faviconUrl = customization?.faviconUrl || globalSettings?.defaultFaviconUrl;
    const analyticsConfig = customization?.analyticsConfig;
    const gaId = analyticsConfig?.googleAnalyticsId?.trim() || globalSettings?.ga4MeasurementId?.trim();
    const pDomain = analyticsConfig?.plausibleDomain?.trim() || globalSettings?.plausibleDomain?.trim();

    // 1. Dynamic Favicon injection
    let linkIcon: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    const originalFaviconHref = linkIcon ? linkIcon.href : '/favicon.ico';
    if (faviconUrl) {
      if (!linkIcon) {
        linkIcon = document.createElement('link');
        linkIcon.rel = 'icon';
        document.head.appendChild(linkIcon);
      }
      linkIcon.href = faviconUrl;
    }

    // 2. Dynamic PWA Web App Manifest injection
    let manifestLink: HTMLLinkElement | null = document.querySelector("link[rel='manifest']");
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = `/api/portfolio/public/${activeSubdomain}/manifest.json`;

    // 3. Dynamic Google Analytics 4 (gtag.js)
    if (gaId) {
      if (!document.getElementById('ga-script')) {
        const script1 = document.createElement('script');
        script1.id = 'ga-script';
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.id = 'ga-init';
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `;
        document.head.appendChild(script2);
      }
    }

    // 4. Dynamic Plausible Analytics
    if (pDomain) {
      if (!document.getElementById('plausible-script')) {
        const script = document.createElement('script');
        script.id = 'plausible-script';
        script.defer = true;
        script.setAttribute('data-domain', pDomain);
        script.src = 'https://plausible.io/js/script.js';
        document.head.appendChild(script);
      }
    }

    return () => {
      // Revert favicon on page leave
      if (linkIcon && originalFaviconHref) {
        linkIcon.href = originalFaviconHref;
      }
    };
  }, [portfolioData, globalSettings, activeSubdomain]);

  const fetchPublicPortfolio = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res: any = await api.get(`/portfolio/public/${activeSubdomain}`);
      setPortfolioData(res.data);
    } catch (err: any) {
      setError(err.message || 'Portfolio not found or currently private.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (contactData: any) => {
    await api.post('/messages/public', {
      subdomain: activeSubdomain,
      ...contactData,
    });
  };

  const handleDownloadPdf = async (templateStyle: string = 'modern') => {
    if (isDownloadingResume) return;
    setIsDownloadingResume(true);
    setResumeDownloadError('');

    try {
      const response: any = await api.get(`/portfolio/pdf?subdomain=${activeSubdomain}&template=${templateStyle}`, {
        responseType: 'blob',
      });
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' });
      if (blob.size === 0) throw new Error('The resume file was empty. Please try again.');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ownerName = portfolioData?.owner?.fullName || 'Portfolio_Owner';
      const fileName = `${ownerName.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Resume'}_${templateStyle}_Resume.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      console.error('Download PDF error:', err);
      setResumeDownloadError(err?.message || 'Unable to generate this resume. Please try again.');
    } finally {
      setIsDownloadingResume(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm animate-pulse">Loading portfolio for {getPublicPortfolioDisplay(activeSubdomain)}...</p>
      </div>
    );
  }

  if (error || !portfolioData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Portfolio Unavailable</h1>
        <p className="text-slate-400 text-sm max-w-md">{error || 'This portfolio does not exist or has been unpublished by the owner.'}</p>
        <a href="/" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition">
          Return to Platform Homepage
        </a>
      </div>
    );
  }

  const { profile, owner, subdomain } = portfolioData;
  const hasVerifiedDocs = (profile?.verifiedDocuments?.length ?? 0) > 0 || Boolean(profile?.hasVerifiedDocuments);

  return (
    <>
      <ThemeEngine
        profile={profile}
        subdomain={subdomain}
        onOpenQrModal={() => setIsQrOpen(true)}
        onOpenReviewModal={() => setIsReviewOpen(true)}
        onDownloadPdf={handleDownloadPdf}
        isDownloadingResume={isDownloadingResume}
        resumeDownloadError={resumeDownloadError}
        onSendMessage={handleSendMessage}
        onOpenVerifiedDocs={handleOpenVerifiedDocs}
        hasVerifiedDocs={hasVerifiedDocs}
        onOpenScheduleModal={() => {
          setScheduleModalMode('all');
          setIsScheduleModalOpen(true);
        }}
        onOpenCallModal={() => {
          setScheduleModalMode('call');
          setIsScheduleModalOpen(true);
        }}
      />

      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        portfolioUrl={getPublicPortfolioUrl(subdomain)}
        fullName={owner.fullName}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        profileId={profile.id}
        fullName={owner.fullName}
      />

      <VerifiedDocumentsUnlockModal
        isOpen={isVerifiedDocsOpen}
        onClose={() => setIsVerifiedDocsOpen(false)}
        subdomain={activeSubdomain}
        ownerName={owner.fullName}
        hasDocuments={true}
        initialTab={verifiedDocsInitialTab}
      />

      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        subdomain={subdomain || activeSubdomain}
        candidateName={owner.fullName}
        candidateTitle={profile?.title}
        mode={scheduleModalMode}
      />
    </>
  );
};
