import React, { useEffect, useRef, useState } from "react";
import api from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { Modal } from "../../components/ui/Modal";
import {
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Plus,
  Trash2,
  Save,
  Check,
  Edit3,
  ExternalLink,
  Github,
  Star,
  Globe,
  Layers,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Share2,
  Eye,
  Lock,
  FileText,
  ShieldCheck,
  Key,
  Copy,
  Upload,
  Clock,
  User,
  Users,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { ImageUploadWidget } from "../../components/ui/ImageUploadWidget";
import { CertificateUploadWidget } from "../../components/ui/CertificateUploadWidget";
import { VERIFIED_DOCUMENT_TYPES } from "../../types";

export const ProfileEditorPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "general"
    | "contacts"
    | "experience"
    | "education"
    | "skills"
    | "projects"
    | "certifications"
    | "references"
    | "verified-docs"
  >("general");

  // Verified Documents State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({ documentType: 'GOVERNMENT_ID', title: '', documentNumber: '' });
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const docFileRef = useRef<HTMLInputElement>(null);

  // Access Keys State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyForm, setKeyForm] = useState({ recipientName: '', recipientEmail: '', validityHours: 24 });
  const [keyLoading, setKeyLoading] = useState(false);
  const [newKey, setNewKey] = useState<any>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // General Form State
  const [generalState, setGeneralState] = useState<any>({});
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // OCR CV scan and profile import state
  const [isAiCvModalOpen, setIsAiCvModalOpen] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isCvScanning, setIsCvScanning] = useState(false);
  const [extractedCv, setExtractedCv] = useState<any>(null);
  const [cvImportMode, setCvImportMode] = useState<'replace' | 'append'>('replace');
  const [selectedCvSections, setSelectedCvSections] = useState<Record<string, boolean>>({
    general: true,
    contacts: true,
    experience: true,
    education: true,
    skills: true,
    certifications: true,
    languages: true,
    references: true,
  });
  const [cvActivePreviewTab, setCvActivePreviewTab] = useState<string>('general');
  const [isApplyingCv, setIsApplyingCv] = useState(false);
  const [cvApplyMessage, setCvApplyMessage] = useState('');
  const [cvScanError, setCvScanError] = useState('');
  const [isCvResetting, setIsCvResetting] = useState(false);
  const cvFileInputRef = useRef<HTMLInputElement>(null);

  // Reset Profile State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // New Item Modals
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [isSavingExp, setIsSavingExp] = useState(false);
  const [expError, setExpError] = useState('');
  const [newExp, setNewExp] = useState({
    company: "",
    position: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [eduForm, setEduForm] = useState({
    institution: "",
    qualification: "",
    field: "",
    startDate: "",
    endDate: "",
    grade: "",
    certificateUrl: "",
  });

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState<{ name: string; category: 'Technical' | 'Soft' }>({
    name: "",
    category: "Technical",
  });

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    longDescription: "",
    imageUrl: "",
    demoUrl: "",
    githubUrl: "",
    technologies: "React, TypeScript, TailwindCSS",
    role: "Full Stack",
    featured: false,
  });

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [certForm, setCertForm] = useState({
    name: "",
    issuingOrganization: "",
    issueDate: "",
    credentialUrl: "",
    certificateUrl: "",
  });

  // References State
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [refForm, setRefForm] = useState({
    name: "",
    position: "",
    organization: "",
    email: "",
    phone: "",
    relationship: "",
    isPublic: false,
  });
  const [isSavingRef, setIsSavingRef] = useState(false);
  const [refError, setRefError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get("/profile");
      setProfile(res.data);
      setGeneralState({
        title: res.data.title || "",
        headline: res.data.headline || "",
        summary: res.data.summary || "",
        contactEmail: res.data.contactEmail || res.data.user?.email || "",
        location: res.data.location || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
        website: res.data.website || "",
        github: res.data.github || "",
        linkedin: res.data.linkedin || "",
        twitter: res.data.twitter || "",
        facebook: res.data.facebook || "",
        instagram: res.data.instagram || "",
        behance: res.data.behance || "",
        dribbble: res.data.dribbble || "",
        avatarUrl: res.data.avatarUrl || "",
        coverUrl: res.data.coverUrl || "",
        isPublicEmail: res.data.isPublicEmail ?? true,
        isPublicPhone: res.data.isPublicPhone ?? false,
        isPublicLocation: res.data.isPublicLocation ?? true,
        isPublicAddress: res.data.isPublicAddress ?? false,
        isPublicSocial: res.data.isPublicSocial ?? true,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      const envelope: any = await api.put('/profile', generalState);
      const updated = envelope?.data ?? envelope;
      if (updated && typeof updated === 'object') {
        setProfile(updated);
        setGeneralState((prev: any) => ({
          ...prev,
          avatarUrl: updated.avatarUrl ?? prev.avatarUrl,
          coverUrl: updated.coverUrl ?? prev.coverUrl,
        }));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setSaveError(e?.message || 'Save failed. Please try again.');
      console.error('[ProfileEditor] Save error:', e);
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleOpenNewExp = () => {
    setEditingExpId(null);
    setExpError('');
    setNewExp({
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    });
    setIsExpModalOpen(true);
  };

  const handleOpenEditExp = (exp: any) => {
    setEditingExpId(exp.id);
    setExpError('');
    const descriptionText = exp.description || (Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 ? exp.responsibilities.join('\n') : "");
    setNewExp({
      company: exp.company || "",
      position: exp.position || "",
      location: exp.location || "",
      startDate: exp.startDate || "",
      endDate: exp.isCurrent ? "" : (exp.endDate || ""),
      isCurrent: Boolean(exp.isCurrent),
      description: descriptionText,
    });
    setIsExpModalOpen(true);
  };

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingExp(true);
    setExpError('');

    try {
      const payload: any = {
        company: newExp.company.trim(),
        position: newExp.position.trim(),
        location: newExp.location?.trim() || null,
        startDate: newExp.startDate.trim(),
        endDate: newExp.isCurrent ? null : (newExp.endDate?.trim() || null),
        isCurrent: Boolean(newExp.isCurrent),
        description: newExp.description?.trim() || null,
      };

      if (newExp.description) {
        const lines = newExp.description.split('\n').map((l: string) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
        if (lines.length > 1) {
          payload.responsibilities = lines;
        }
      }

      if (editingExpId) {
        await api.put(`/profile/experiences/${editingExpId}`, payload);
      } else {
        await api.post("/profile/experiences", payload);
      }
      setIsExpModalOpen(false);
      setEditingExpId(null);
      setNewExp({
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
      });
      await fetchProfile();
    } catch (e: any) {
      console.error(e);
      setExpError(e?.message || 'Failed to save experience.');
    } finally {
      setIsSavingExp(false);
    }
  };

  const fetchLatestCvExtraction = async () => {
    try {
      const res: any = await api.get('/cv/extraction');
      if (res?.data?.extractedData) {
        setExtractedCv(res.data.extractedData);
      }
    } catch {
      // No existing extraction found
    }
  };

  const handleScanCv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) return;

    setIsCvScanning(true);
    setCvScanError('');
    setCvApplyMessage('');

    const formData = new FormData();
    formData.append('file', cvFile);

    try {
      const res: any = await api.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.data?.extraction?.extractedData) {
        setExtractedCv(res.data.extraction.extractedData);
      } else {
        await fetchLatestCvExtraction();
      }
    } catch (err: any) {
      console.error('CV Upload & Scan error:', err);
      setCvScanError(err?.message || 'CV processing failed. Please try again.');
    } finally {
      setIsCvScanning(false);
    }
  };

  const handleApplyCvToProfile = async () => {
    if (!extractedCv) return;

    setIsApplyingCv(true);
    setCvApplyMessage('');
    setCvScanError('');

    try {
      const selectedList = Object.keys(selectedCvSections).filter((k) => selectedCvSections[k]);
      const res: any = await api.post('/cv/import', {
        extractedData: extractedCv,
        options: {
          importMode: cvImportMode,
          selectedSections: selectedList,
        },
      });

      const updated = res?.data ?? res;
      if (updated && typeof updated === 'object') {
        setProfile(updated);
        setGeneralState((prev: any) => ({
          ...prev,
          title: updated.title ?? prev.title,
          headline: updated.headline ?? prev.headline,
          summary: updated.summary ?? prev.summary,
          contactEmail: updated.contactEmail ?? prev.contactEmail,
          location: updated.location ?? prev.location,
          phone: updated.phone ?? prev.phone,
          address: updated.address ?? prev.address,
          website: updated.website ?? prev.website,
          github: updated.github ?? prev.github,
          linkedin: updated.linkedin ?? prev.linkedin,
          twitter: updated.twitter ?? prev.twitter,
        }));
      } else {
        await fetchProfile();
      }

      setCvApplyMessage('All selected CV sections have been applied to your profile tabs!');
      setTimeout(() => {
        setIsAiCvModalOpen(false);
        setCvApplyMessage('');
      }, 1800);
    } catch (err: any) {
      console.error('Apply CV error:', err);
      setCvScanError(err?.message || 'Failed to apply CV details to profile.');
    } finally {
      setIsApplyingCv(false);
    }
  };

  const handleResetCvScanner = async () => {
    setIsCvResetting(true);
    setCvScanError('');
    setCvApplyMessage('');
    try {
      await api.delete('/cv/extraction');
    } catch {
      // Ignore if no saved extraction
    } finally {
      setCvFile(null);
      setExtractedCv(null);
      setIsCvResetting(false);
      if (cvFileInputRef.current) cvFileInputRef.current.value = '';
    }
  };

  const handleResetProfile = async () => {
    setIsResetting(true);
    try {
      const res: any = await api.post('/profile/reset');
      const updated = res?.data ?? res;
      if (updated && typeof updated === 'object') {
        setProfile(updated);
      }
      setGeneralState({
        title: '',
        headline: '',
        summary: '',
        careerObjective: '',
        bio: '',
        contactEmail: '',
        phone: '',
        location: '',
        address: '',
        website: '',
        linkedin: '',
        github: '',
        twitter: '',
        behance: '',
        dribbble: '',
        facebook: '',
        instagram: '',
        youtube: '',
        avatarUrl: '',
        coverUrl: '',
      });
      setIsResetModalOpen(false);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3500);
    } catch (err: any) {
      console.error('Reset profile error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await api.delete(`/profile/experiences/${id}`);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCertification = async (id: string) => {
    try {
      await api.delete(`/profile/certifications/${id}`);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNewRef = () => {
    setEditingRefId(null);
    setRefForm({
      name: "",
      position: "",
      organization: "",
      email: "",
      phone: "",
      relationship: "",
      isPublic: false,
    });
    setRefError("");
    setIsRefModalOpen(true);
  };

  const handleOpenEditRef = (refItem: any) => {
    setEditingRefId(refItem.id);
    setRefForm({
      name: refItem.name || "",
      position: refItem.position || "",
      organization: refItem.organization || "",
      email: refItem.email || "",
      phone: refItem.phone || "",
      relationship: refItem.relationship || "",
      isPublic: Boolean(refItem.isPublic),
    });
    setRefError("");
    setIsRefModalOpen(true);
  };

  const handleSaveReference = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRef(true);
    setRefError("");

    try {
      const payload = {
        name: refForm.name.trim(),
        position: refForm.position.trim(),
        organization: refForm.organization.trim(),
        email: refForm.email.trim() || null,
        phone: refForm.phone.trim() || null,
        relationship: refForm.relationship.trim() || null,
        isPublic: refForm.isPublic,
      };

      if (editingRefId) {
        await api.put(`/profile/references/${editingRefId}`, payload);
      } else {
        await api.post("/profile/references", payload);
      }

      setIsRefModalOpen(false);
      await fetchProfile();
    } catch (err: any) {
      console.error("Failed to save reference:", err);
      setRefError(err?.message || "Failed to save referee.");
    } finally {
      setIsSavingRef(false);
    }
  };

  const handleDeleteReference = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this referee?")) return;
    try {
      await api.delete(`/profile/references/${id}`);
      await fetchProfile();
    } catch (e) {
      console.error("Failed to delete referee:", e);
    }
  };

  const handleOpenNewEdu = () => {
    setEditingEduId(null);
    setEduForm({
      institution: "",
      qualification: "",
      field: "",
      startDate: "",
      endDate: "",
      grade: "",
      certificateUrl: "",
    });
    setIsEduModalOpen(true);
  };

  const handleOpenEditEdu = (edu: any) => {
    setEditingEduId(edu.id);
    setEduForm({
      institution: edu.institution || "",
      qualification: edu.qualification || "",
      field: edu.field || "",
      startDate: edu.startDate || "",
      endDate: edu.endDate || "",
      grade: edu.grade || "",
      certificateUrl: edu.certificateUrl || "",
    });
    setIsEduModalOpen(true);
  };

  const handleSaveEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEduId) {
        await api.put(`/profile/educations/${editingEduId}`, eduForm);
      } else {
        await api.post("/profile/educations", eduForm);
      }
      setIsEduModalOpen(false);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      await api.delete(`/profile/educations/${id}`);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;
    try {
      await api.post("/profile/skills", {
        name: newSkill.name.trim(),
        category: newSkill.category || 'Technical',
      });
      setIsSkillModalOpen(false);
      setNewSkill({ name: "", category: "Technical" });
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await api.delete(`/profile/skills/${id}`);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNewProject = () => {
    setEditingProjectId(null);
    setProjectForm({
      title: "",
      description: "",
      longDescription: "",
      imageUrl: "",
      demoUrl: "",
      githubUrl: "",
      technologies: "React, TypeScript, TailwindCSS",
      role: "Full Stack",
      featured: false,
    });
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: any) => {
    setEditingProjectId(proj.id);
    setProjectForm({
      title: proj.title || "",
      description: proj.description || "",
      longDescription: proj.longDescription || "",
      imageUrl: proj.imageUrl || "",
      demoUrl: proj.demoUrl || "",
      githubUrl: proj.githubUrl || "",
      technologies: Array.isArray(proj.technologies)
        ? proj.technologies.join(", ")
        : (proj.technologies || ""),
      role: proj.role || "Full Stack",
      featured: Boolean(proj.featured),
    });
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...projectForm,
        technologies: projectForm.technologies
          ? projectForm.technologies.split(",").map((t: string) => t.trim()).filter(Boolean)
          : [],
      };
      if (editingProjectId) {
        await api.put(`/profile/projects/${editingProjectId}`, payload);
      } else {
        await api.post("/profile/projects", payload);
      }
      setIsProjectModalOpen(false);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.delete(`/profile/projects/${id}`);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNewCert = () => {
    setEditingCertId(null);
    setCertForm({
      name: "",
      issuingOrganization: "",
      issueDate: "",
      credentialUrl: "",
      certificateUrl: "",
    });
    setIsCertModalOpen(true);
  };

  const handleOpenEditCert = (cert: any) => {
    setEditingCertId(cert.id);
    setCertForm({
      name: cert.name || "",
      issuingOrganization: cert.issuingOrganization || "",
      issueDate: cert.issueDate || "",
      credentialUrl: cert.credentialUrl || "",
      certificateUrl: cert.certificateUrl || "",
    });
    setIsCertModalOpen(true);
  };

  const handleSaveCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCertId) {
        await api.put(`/profile/certifications/${editingCertId}`, certForm);
      } else {
        await api.post("/profile/certifications", certForm);
      }
      setIsCertModalOpen(false);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadVerifiedDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      setDocError('Please select a file to upload.');
      return;
    }
    setDocUploading(true);
    setDocError('');
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('documentType', docForm.documentType);
      formData.append(
        'title',
        docForm.title || VERIFIED_DOCUMENT_TYPES.find(d => d.type === docForm.documentType)?.label || 'Verified Document'
      );
      if (docForm.documentNumber) formData.append('documentNumber', docForm.documentNumber);

      await api.post('/profile/verified-documents', formData);
      setIsDocModalOpen(false);
      setDocFile(null);
      setDocError('');
      setDocForm({ documentType: 'GOVERNMENT_ID', title: '', documentNumber: '' });
      fetchProfile();
    } catch (err: any) {
      console.error('Upload document error:', err);
      setDocError(err?.message || 'Failed to upload document. Please try again.');
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteVerifiedDoc = async (id: string) => {
    if (!confirm('Remove this verified document?')) return;
    try {
      await api.delete(`/profile/verified-documents/${id}`);
      fetchProfile();
    } catch (e) { console.error(e); }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyLoading(true);
    try {
      const res: any = await api.post('/profile/document-keys/generate', keyForm);
      setNewKey(res.data);
    } catch (e) { console.error(e); }
    finally { setKeyLoading(false); }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await api.delete(`/profile/document-keys/${id}`);
      fetchProfile();
    } catch (e) { console.error(e); }
  };

  const copyKey = (code: string) => {
    navigator.clipboard.writeText(code);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Profile Data Editor
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Manage your bio, experience, education, skills, projects, and
            certifications.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsResetModalOpen(true)}
            className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            leftIcon={<RotateCcw className="w-4 h-4 text-red-400" />}
          >
            Reset Profile
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setIsAiCvModalOpen(true);
              fetchLatestCvExtraction();
            }}
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-lg shadow-indigo-500/25 border-0 text-white font-bold"
            leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
          >
            Scan CV with OCR
          </Button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile has been reset to an empty state. All tabs are now cleared and ready for new content.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-400 overflow-x-auto no-scrollbar scroll-smooth">
        <button onClick={() => setActiveTab("general")} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "general" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}>General Bio</button>
        <button onClick={() => setActiveTab("contacts")} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "contacts" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}>Contact &amp; Social</button>
        <button onClick={() => setActiveTab("experience")} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "experience" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}>Work Experience ({profile?.experiences?.length || 0})</button>
        <button onClick={() => setActiveTab("education")} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "education" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}>Education ({profile?.educations?.length || 0})</button>
        <button onClick={() => setActiveTab("skills")} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "skills" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}>Skills ({profile?.skills?.length || 0})</button>
        <button onClick={() => setActiveTab("projects")} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "projects" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}>Projects ({profile?.projects?.length || 0})</button>
        <button onClick={() => setActiveTab("certifications")} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "certifications" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}>Certifications ({profile?.certifications?.length || 0})</button>
        <button onClick={() => setActiveTab("references")} className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${activeTab === "references" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}>
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          Referees ({profile?.references?.length || 0})
        </button>
        <button onClick={() => setActiveTab("verified-docs")} className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${activeTab === "verified-docs" ? "border-emerald-500 text-emerald-400" : "border-transparent hover:text-white"}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Docs ({profile?.verifiedDocuments?.length || 0})
        </button>
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveGeneral();
          }}
          className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6"
        >
          {/* Avatar and Cover Drag-and-Drop Image Uploaders */}
          <div className="grid md:grid-cols-3 gap-6 pb-4 border-b border-slate-800">
            <div>
              <ImageUploadWidget
                label="Profile Avatar Photo"
                fieldName="avatarUrl"
                value={generalState.avatarUrl || ''}
                onChange={(url) => setGeneralState((prev: any) => ({ ...prev, avatarUrl: url }))}
                aspectRatio="square"
              />
            </div>
            <div className="md:col-span-2">
              <ImageUploadWidget
                label="Header Cover Banner"
                fieldName="coverUrl"
                value={generalState.coverUrl || ''}
                onChange={(url) => setGeneralState((prev: any) => ({ ...prev, coverUrl: url }))}
                aspectRatio="banner"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Professional Title
              </label>
              <input
                type="text"
                value={generalState.title}
                onChange={(e) =>
                  setGeneralState({ ...generalState, title: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Headline
              </label>
              <input
                type="text"
                value={generalState.headline}
                onChange={(e) =>
                  setGeneralState({ ...generalState, headline: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Summary
              </label>
            </div>
            <textarea
              rows={4}
              value={generalState.summary}
              onChange={(e) =>
                setGeneralState({ ...generalState, summary: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Location
              </label>
              <input
                type="text"
                value={generalState.location}
                onChange={(e) =>
                  setGeneralState({ ...generalState, location: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                GitHub URL
              </label>
              <input
                type="text"
                value={generalState.github}
                onChange={(e) =>
                  setGeneralState({ ...generalState, github: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                LinkedIn URL
              </label>
              <input
                type="text"
                value={generalState.linkedin}
                onChange={(e) =>
                  setGeneralState({ ...generalState, linkedin: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSavingGeneral}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Details
            </Button>

            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold animate-in fade-in slide-in-from-left-2 duration-300">
                <Check className="w-4 h-4" />
                Profile saved successfully!
              </span>
            )}

            {saveError && (
              <span className="inline-flex items-center gap-1.5 text-rose-400 text-xs font-semibold animate-in fade-in slide-in-from-left-2 duration-300">
                {saveError}
              </span>
            )}
          </div>
        </form>
      )}

      {/* Contacts & Social Tab */}
      {activeTab === "contacts" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveGeneral();
          }}
          className="space-y-6"
        >
          {/* Section 1: Email Forwarding Configuration */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Portfolio Message Forwarding &amp; Email</h3>
                <p className="text-xs text-slate-400">
                  Configure where visitor inquiries submitted through your portfolio's contact form will be emailed.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Primary Forwarding Contact Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={generalState.contactEmail || ''}
                  onChange={(e) =>
                    setGeneralState({ ...generalState, contactEmail: e.target.value })
                  }
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Messages received on your portfolio domain will be dispatched instantly to this inbox via global SMTP.
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <input
                  type="checkbox"
                  id="isPublicEmail"
                  checked={generalState.isPublicEmail ?? true}
                  onChange={(e) =>
                    setGeneralState({ ...generalState, isPublicEmail: e.target.checked })
                  }
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPublicEmail" className="text-xs text-slate-300 font-medium cursor-pointer flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Display contact email address publicly on portfolio footer &amp; contact section</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Phone, Location & Address */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Phone &amp; Location Details</h3>
                <p className="text-xs text-slate-400">Manage phone number, city, and physical work location.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phone / Mobile Number</span>
                </label>
                <input
                  type="text"
                  value={generalState.phone || ''}
                  onChange={(e) => setGeneralState({ ...generalState, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublicPhone"
                    checked={generalState.isPublicPhone ?? false}
                    onChange={(e) => setGeneralState({ ...generalState, isPublicPhone: e.target.checked })}
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-indigo-600"
                  />
                  <label htmlFor="isPublicPhone" className="text-[11px] text-slate-400 cursor-pointer">
                    Show phone on portfolio
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Location (City, Country)</span>
                </label>
                <input
                  type="text"
                  value={generalState.location || ''}
                  onChange={(e) => setGeneralState({ ...generalState, location: e.target.value })}
                  placeholder="San Francisco, CA, USA"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublicLocation"
                    checked={generalState.isPublicLocation ?? true}
                    onChange={(e) => setGeneralState({ ...generalState, isPublicLocation: e.target.checked })}
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-indigo-600"
                  />
                  <label htmlFor="isPublicLocation" className="text-[11px] text-slate-400 cursor-pointer">
                    Show location on portfolio
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Office Address</span>
                </label>
                <textarea
                  rows={2}
                  value={generalState.address || ''}
                  onChange={(e) => setGeneralState({ ...generalState, address: e.target.value })}
                  placeholder="Suite 400, 100 Tech Boulevard"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Social & Online Presence Links */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Social Media &amp; Portfolio Links</h3>
                  <p className="text-xs text-slate-400">Connect your public developer &amp; professional profiles.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublicSocial"
                  checked={generalState.isPublicSocial ?? true}
                  onChange={(e) => setGeneralState({ ...generalState, isPublicSocial: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600"
                />
                <label htmlFor="isPublicSocial" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Public Icons
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  <span>Personal Website URL</span>
                </label>
                <input
                  type="url"
                  value={generalState.website || ''}
                  onChange={(e) => setGeneralState({ ...generalState, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-purple-400" />
                  <span>GitHub Profile</span>
                </label>
                <input
                  type="url"
                  value={generalState.github || ''}
                  onChange={(e) => setGeneralState({ ...generalState, github: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  <span>LinkedIn Profile</span>
                </label>
                <input
                  type="url"
                  value={generalState.linkedin || ''}
                  onChange={(e) => setGeneralState({ ...generalState, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  <span>Twitter / X Profile</span>
                </label>
                <input
                  type="url"
                  value={generalState.twitter || ''}
                  onChange={(e) => setGeneralState({ ...generalState, twitter: e.target.value })}
                  placeholder="https://x.com/username"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  <span>Facebook Profile</span>
                </label>
                <input
                  type="url"
                  value={generalState.facebook || ''}
                  onChange={(e) => setGeneralState({ ...generalState, facebook: e.target.value })}
                  placeholder="https://facebook.com/username"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  <span>Instagram Handle</span>
                </label>
                <input
                  type="url"
                  value={generalState.instagram || ''}
                  onChange={(e) => setGeneralState({ ...generalState, instagram: e.target.value })}
                  placeholder="https://instagram.com/username"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  <span>Behance Profile</span>
                </label>
                <input
                  type="url"
                  value={generalState.behance || ''}
                  onChange={(e) => setGeneralState({ ...generalState, behance: e.target.value })}
                  placeholder="https://behance.net/username"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  <span>Dribbble Shots Link</span>
                </label>
                <input
                  type="url"
                  value={generalState.dribbble || ''}
                  onChange={(e) => setGeneralState({ ...generalState, dribbble: e.target.value })}
                  placeholder="https://dribbble.com/username"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSavingGeneral}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Contact Settings
            </Button>

            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold animate-in fade-in slide-in-from-left-2 duration-300">
                <Check className="w-4 h-4" />
                Contacts saved successfully!
              </span>
            )}

            {saveError && (
              <span className="inline-flex items-center gap-1.5 text-rose-400 text-xs font-semibold animate-in fade-in slide-in-from-left-2 duration-300">
                {saveError}
              </span>
            )}
          </div>
        </form>
      )}

      {/* Experience Tab */}
      {activeTab === "experience" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Work Experience</h3>
              <p className="text-xs text-slate-400">Manage your career history, achievements, and responsibilities.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewExp}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Experience
            </Button>
          </div>

          <div className="space-y-4">
            {(!profile?.experiences || profile.experiences.length === 0) && (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">No Experience Entries Yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Add your past roles manually or let AI extract them automatically from your CV.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsAiCvModalOpen(true);
                      fetchLatestCvExtraction();
                    }}
                    leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                  >
                    Auto-Fill from CV
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenNewExp}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Experience Manually
                  </Button>
                </div>
              </div>
            )}

            {profile?.experiences?.map((exp: any) => (
              <div
                key={exp.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {exp.position} — {exp.company}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate || "Present"}
                    {exp.location ? ` | ${exp.location}` : ""}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 pt-1">
                      {exp.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEditExp(exp)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                    title="Edit Experience"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                    title="Delete Experience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Tab */}
      {activeTab === "education" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">
              Education Background
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewEdu}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Education
            </Button>
          </div>

          <div className="space-y-4">
            {(!profile?.educations || profile.educations.length === 0) && (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">No Education Records Yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Add your degrees and institutions manually or scan them directly from your resume.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsAiCvModalOpen(true);
                      fetchLatestCvExtraction();
                    }}
                    leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                  >
                    Auto-Fill from CV
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenNewEdu}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Education Manually
                  </Button>
                </div>
              </div>
            )}

            {profile?.educations?.map((edu: any) => (
              <div
                key={edu.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">
                      {edu.qualification} in {edu.field} — {edu.institution}
                    </h4>
                    {edu.certificateUrl && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Certificate Attached
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {edu.startDate} – {edu.endDate || "Present"}{" "}
                    {edu.grade ? `(${edu.grade})` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEditEdu(edu)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                    title="Edit Education"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEducation(edu.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                    title="Delete Education"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === "skills" && (() => {
        const technicalSkills = profile?.skills?.filter((s: any) => s.category !== 'Soft') || [];
        const softSkills = profile?.skills?.filter((s: any) => s.category === 'Soft') || [];

        const openSkillModal = (cat: 'Technical' | 'Soft' = 'Technical') => {
          setNewSkill({ name: '', category: cat });
          setIsSkillModalOpen(true);
        };

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Skills &amp; Competencies</h3>
                <p className="text-xs text-slate-400">Manage technical stack and soft interpersonal capabilities.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openSkillModal('Technical')}
                  leftIcon={<Plus className="w-4 h-4 text-indigo-400" />}
                >
                  Add Technical Skill
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openSkillModal('Soft')}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Soft Skill
                </Button>
              </div>
            </div>

            {(!profile?.skills || profile.skills.length === 0) && (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <Code className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">No Skills Added Yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Quickly populate your skillset by scanning your CV or adding skills manually.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsAiCvModalOpen(true);
                      fetchLatestCvExtraction();
                    }}
                    leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                  >
                    Auto-Fill from CV
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openSkillModal('Technical')}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Manually
                  </Button>
                </div>
              </div>
            )}

            {/* Categorized Skills Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Technical Skills Card */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/20 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                      <Code className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Technical Skills &amp; Stack</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {technicalSkills.length}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">Languages, frameworks, databases &amp; dev tools</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSkillModal('Technical')}
                    className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition text-xs flex items-center gap-1 font-medium"
                    title="Add technical skill"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {technicalSkills.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-3 text-center">No technical skills added yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {technicalSkills.map((skill: any) => (
                      <div
                        key={skill.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center gap-2 text-xs font-semibold text-slate-200 group hover:border-indigo-400 transition"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="text-slate-500 hover:text-red-400 transition ml-1"
                          title={`Remove ${skill.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Soft Skills Card */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/20 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Soft Skills &amp; Interpersonal</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {softSkills.length}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">Leadership, collaboration, communication &amp; agility</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSkillModal('Soft')}
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition text-xs flex items-center gap-1 font-medium"
                    title="Add soft skill"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {softSkills.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-3 text-center">No soft skills added yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {softSkills.map((skill: any) => (
                      <div
                        key={skill.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center gap-2 text-xs font-semibold text-slate-200 group hover:border-emerald-400 transition"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="text-slate-500 hover:text-red-400 transition ml-1"
                          title={`Remove ${skill.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Featured Projects Showcase</span>
              </h3>
              <p className="text-xs text-slate-400">Manage work portfolio items, cover photos, live links, and technologies used.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewProject}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add New Project
            </Button>
          </div>

          {(!profile?.projects || profile.projects.length === 0) && (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">No Projects Added Yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Showcase your key projects, code repositories, and demo applications.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsAiCvModalOpen(true);
                    fetchLatestCvExtraction();
                  }}
                  leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                >
                  Auto-Fill from CV
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenNewProject}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Project Manually
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile?.projects?.map((proj: any) => (
              <div
                key={proj.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  {/* Cover Image Preview */}
                  {proj.imageUrl && (
                    <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 relative">
                      <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" />
                      {proj.featured && (
                        <span className="absolute top-2.5 right-2.5 bg-amber-500/90 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <Star className="w-3 h-3 fill-slate-950" /> Featured
                        </span>
                      )}
                    </div>
                  )}

                  {/* Header & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {proj.role && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            {proj.role}
                          </span>
                        )}
                        {proj.featured && !proj.imageUrl && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" /> Featured
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white">
                        {proj.title}
                      </h4>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditProject(proj)}
                        className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                        title="Edit Project"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>

                  {/* Technologies Tags */}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(Array.isArray(proj.technologies) ? proj.technologies : String(proj.technologies).split(',')).map((tech: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* External Links */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {proj.demoUrl && (
                      <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white font-semibold flex items-center gap-1">
                        <Github className="w-3.5 h-3.5" />
                        <span>Source Code</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === "certifications" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Certifications</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewCert}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Certification
            </Button>
          </div>

          <div className="space-y-4">
            {(!profile?.certifications || profile.certifications.length === 0) && (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">No Certifications Yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Add industry certifications and credentials to enhance credibility.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsAiCvModalOpen(true);
                      fetchLatestCvExtraction();
                    }}
                    leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                  >
                    Auto-Fill from CV
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenNewCert}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Certification
                  </Button>
                </div>
              </div>
            )}

            {profile?.certifications?.map((cert: any) => (
              <div
                key={cert.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">
                      {cert.name} — {cert.issuingOrganization}
                    </h4>
                    {cert.certificateUrl && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Certificate Attached
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Issued: {cert.issueDate}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEditCert(cert)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                    title="Edit Certification"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCertification(cert.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                    title="Delete Certification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referees Tab */}
      {activeTab === "references" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Professional Referees &amp; References</span>
              </h3>
              <p className="text-xs text-slate-400">Manage individuals who can endorse your career experience and credentials.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewRef}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Referee
            </Button>
          </div>

          <div className="space-y-4">
            {(!profile?.references || profile.references.length === 0) && (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">No Referees Added Yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Add former managers, mentors, or academic advisors. You can choose whether they appear on your public portfolio.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsAiCvModalOpen(true);
                      fetchLatestCvExtraction();
                    }}
                    leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                  >
                    Auto-Fill from CV
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenNewRef}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Referee Manually
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile?.references?.map((refItem: any) => (
                <div
                  key={refItem.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <span>{refItem.name}</span>
                          {refItem.isPublic ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Public
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              On Request
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-indigo-400 font-semibold">
                          {refItem.position} &mdash; {refItem.organization}
                        </p>
                        {refItem.relationship && (
                          <p className="text-[11px] text-slate-400 italic pt-0.5">
                            Relationship: {refItem.relationship}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditRef(refItem)}
                          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="Edit Referee"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReference(refItem.id)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                          title="Delete Referee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-3 text-xs text-slate-300">
                      {refItem.email && (
                        <a href={`mailto:${refItem.email}`} className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{refItem.email}</span>
                        </a>
                      )}
                      {refItem.phone && (
                        <a href={`tel:${refItem.phone}`} className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{refItem.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Verified Documents Tab */}
      {activeTab === "verified-docs" && (
        <div className="space-y-8">
          {/* Info Banner */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-300">Secure Employee Verification Hub</p>
              <p className="text-xs text-emerald-400/80 leading-relaxed">
                Upload sensitive identity documents below. They are stored securely and <strong>never publicly shown</strong>.
                When a recruiter or employer asks to view your documents, generate a one-time access key and share it with them.
                The key expires after 24 hours and can only be used once.
              </p>
            </div>
          </div>

          {/* Documents Section */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Uploaded Verified Documents</h3>
                  <p className="text-xs text-slate-400">Government & professional identity credentials stored securely.</p>
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={() => { setDocForm({ documentType: 'GOVERNMENT_ID', title: '', documentNumber: '' }); setDocFile(null); setIsDocModalOpen(true); }} leftIcon={<Plus className="w-4 h-4" />}>
                Upload Document
              </Button>
            </div>

            {!profile?.verifiedDocuments?.length ? (
              <div className="py-10 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="text-sm text-slate-500">No verified documents uploaded yet.</p>
                <p className="text-xs text-slate-600">Upload your first document using the button above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.verifiedDocuments.map((doc: any) => {
                  const typeLabel = VERIFIED_DOCUMENT_TYPES.find(d => d.type === doc.documentType)?.label || doc.documentType;
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">{typeLabel}</span>
                            {doc.documentNumber && <span className="text-[10px] text-slate-500">#{doc.documentNumber}</span>}
                            {doc.isVerified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1"><Check className="w-2.5 h-2.5" />Verified</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition" title="View document">
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleDeleteVerifiedDoc(doc.id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition" title="Remove document">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Access Keys Section */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">One-Time Recruiter Access Keys</h3>
                  <p className="text-xs text-slate-400">Generate a temporary key to share with employers for secure, limited-time document access.</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setNewKey(null); setKeyForm({ recipientName: '', recipientEmail: '', validityHours: 24 }); setIsKeyModalOpen(true); }} leftIcon={<Key className="w-4 h-4" />}>
                Generate Key
              </Button>
            </div>

            {!profile?.documentAccessKeys?.length ? (
              <div className="py-8 text-center space-y-2">
                <Key className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="text-sm text-slate-500">No access keys generated yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.documentAccessKeys.map((key: any) => {
                  const expired = new Date() > new Date(key.expiresAt);
                  return (
                    <div key={key.id} className={`flex items-center justify-between p-4 rounded-xl border transition ${key.isUsed ? 'bg-slate-950/60 border-slate-800/60 opacity-60' : expired ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-950 border-slate-800 hover:border-amber-500/30'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${key.isUsed ? 'bg-slate-800 text-slate-500' : expired ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          <Key className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-bold font-mono text-white tracking-widest">{key.code}</code>
                            {key.isUsed && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 font-bold">USED</span>}
                            {!key.isUsed && expired && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">EXPIRED</span>}
                            {!key.isUsed && !expired && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">ACTIVE</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {key.recipientName && <span className="text-[11px] text-slate-400 flex items-center gap-1"><User className="w-3 h-3" />{key.recipientName}</span>}
                            <span className="text-[11px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />Expires: {new Date(key.expiresAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!key.isUsed && !expired && (
                          <button onClick={() => copyKey(key.code)} className="p-2 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 transition" title="Copy key">
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteKey(key.id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition" title="Revoke key">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Experience Add/Edit Modal */}
      <Modal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        title={editingExpId ? "Edit Work Experience" : "Add Work Experience"}
      >
        <form onSubmit={handleSaveExperience} className="space-y-4">
          {expError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{expError}</span>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Company Name *</label>
            <input
              required
              value={newExp.company}
              onChange={(e) =>
                setNewExp({ ...newExp, company: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. Google, Tech Solutions Inc."
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Position / Job Title *</label>
            <input
              required
              value={newExp.position}
              onChange={(e) =>
                setNewExp({ ...newExp, position: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. Senior Software Architect"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Location</label>
            <input
              value={newExp.location}
              onChange={(e) =>
                setNewExp({ ...newExp, location: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. San Francisco, CA (Remote)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Start Date *</label>
              <input
                required
                value={newExp.startDate}
                onChange={(e) =>
                  setNewExp({ ...newExp, startDate: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="2022-01"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">End Date</label>
              <input
                disabled={newExp.isCurrent}
                value={newExp.isCurrent ? "Present" : newExp.endDate}
                onChange={(e) =>
                  setNewExp({ ...newExp, endDate: e.target.value })
                }
                className={`w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm ${newExp.isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="2024-05"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrentExp"
              checked={newExp.isCurrent}
              onChange={(e) =>
                setNewExp({ ...newExp, isCurrent: e.target.checked, endDate: e.target.checked ? "" : newExp.endDate })
              }
              className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="isCurrentExp" className="text-xs text-slate-300 cursor-pointer select-none">
              I currently work here (Present)
            </label>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-semibold">Role Description / Achievements</label>
            </div>
            <textarea
              rows={3}
              value={newExp.description}
              onChange={(e) =>
                setNewExp({ ...newExp, description: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="Key responsibilities and engineering achievements..."
            />
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={isSavingExp}>
            {editingExpId ? "Update Experience" : "Save Experience"}
          </Button>
        </form>
      </Modal>

      {/* Education Modal */}
      <Modal
        isOpen={isEduModalOpen}
        onClose={() => setIsEduModalOpen(false)}
        title={editingEduId ? "Edit Education Record" : "Add Education Record"}
      >
        <form onSubmit={handleSaveEducation} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Institution / University
            </label>
            <input
              required
              value={eduForm.institution}
              onChange={(e) =>
                setEduForm({ ...eduForm, institution: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. Stanford University"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">
                Degree / Qualification
              </label>
              <input
                required
                value={eduForm.qualification}
                onChange={(e) =>
                  setEduForm({ ...eduForm, qualification: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="e.g. Bachelor of Science"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Field of Study</label>
              <input
                required
                value={eduForm.field}
                onChange={(e) =>
                  setEduForm({ ...eduForm, field: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Start Date</label>
              <input
                required
                value={eduForm.startDate}
                onChange={(e) =>
                  setEduForm({ ...eduForm, startDate: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="2018"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">End Date</label>
              <input
                value={eduForm.endDate}
                onChange={(e) =>
                  setEduForm({ ...eduForm, endDate: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="2022"
              />
            </div>
          </div>

          <CertificateUploadWidget
            label="Upload Degree / Education Certificate (PDF or Image)"
            value={eduForm.certificateUrl}
            onChange={(url) => setEduForm({ ...eduForm, certificateUrl: url })}
          />

          <Button type="submit" variant="primary" className="w-full">
            {editingEduId ? "Update Education" : "Save Education"}
          </Button>
        </form>
      </Modal>

      {/* Skill Add Modal */}
      <Modal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        title={newSkill.category === 'Soft' ? 'Add Soft Skill' : 'Add Technical Skill'}
      >
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Skill Name *</label>
            <input
              required
              value={newSkill.name}
              onChange={(e) =>
                setNewSkill({ ...newSkill, name: e.target.value })
              }
              placeholder={newSkill.category === 'Soft' ? 'e.g. Critical Thinking, Leadership...' : 'e.g. React, TypeScript, Docker, PostgreSQL'}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Skill Category *</label>
            <select
              value={newSkill.category}
              onChange={(e) =>
                setNewSkill({ ...newSkill, category: e.target.value as 'Technical' | 'Soft' })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="Technical">Technical Skill / Tool</option>
              <option value="Soft">Soft Skill / Interpersonal</option>
            </select>
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Save Skill
          </Button>
        </form>
      </Modal>

      {/* Project Add/Edit Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={editingProjectId ? "Edit Project Details" : "Add New Project"}
      >
        <form onSubmit={handleSaveProject} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* Project Cover Image Upload */}
          <ImageUploadWidget
            label="Project Cover Image (Thumbnail)"
            value={projectForm.imageUrl}
            onChange={(url) => setProjectForm({ ...projectForm, imageUrl: url })}
            aspectRatio="banner"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Project Title *</label>
              <input
                required
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="e.g. AI Portfolio Generator"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium font-mono">Category / Role</label>
              <input
                value={projectForm.role}
                onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="e.g. Full Stack Web App, Mobile App, AI Model"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              id="featuredProject"
              checked={projectForm.featured}
              onChange={(e) => setProjectForm({ ...projectForm, featured: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
            <label htmlFor="featuredProject" className="text-xs text-slate-300 font-semibold cursor-pointer flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Highlight as Featured Project on Public Portfolio</span>
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-medium">Short Description *</label>
            <textarea
              required
              rows={2}
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="Brief overview of what this project accomplishes..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-medium">Technologies Used (Comma-separated)</label>
            <input
              value={projectForm.technologies}
              onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm font-mono"
              placeholder="React, TypeScript, TailwindCSS, PostgreSQL"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Live Demo URL</label>
              <input
                type="url"
                value={projectForm.demoUrl}
                onChange={(e) => setProjectForm({ ...projectForm, demoUrl: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm font-mono"
                placeholder="https://myproject.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">GitHub Repository URL</label>
              <input
                type="url"
                value={projectForm.githubUrl}
                onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm font-mono"
                placeholder="https://github.com/user/repo"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full">
            {editingProjectId ? "Update Project" : "Save Project"}
          </Button>
        </form>
      </Modal>

      {/* Certification Modal */}
      <Modal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title={editingCertId ? "Edit Certification" : "Add Certification"}
      >
        <form onSubmit={handleSaveCertification} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Certification Name</label>
            <input
              required
              value={certForm.name}
              onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. AWS Certified Solutions Architect"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Issuing Organization
            </label>
            <input
              required
              value={certForm.issuingOrganization}
              onChange={(e) =>
                setCertForm({ ...certForm, issuingOrganization: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. Amazon Web Services"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Issue Date</label>
              <input
                required
                value={certForm.issueDate}
                onChange={(e) =>
                  setCertForm({ ...certForm, issueDate: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="2023-05"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Credential Verification Link (URL)</label>
              <input
                type="url"
                value={certForm.credentialUrl}
                onChange={(e) =>
                  setCertForm({ ...certForm, credentialUrl: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm font-mono"
                placeholder="https://credly.com/..."
              />
            </div>
          </div>

          <CertificateUploadWidget
            label="Upload Official Certificate File (PDF or Image)"
            value={certForm.certificateUrl}
            onChange={(url) => setCertForm({ ...certForm, certificateUrl: url })}
          />

          <Button type="submit" variant="primary" className="w-full">
            {editingCertId ? "Update Certification" : "Save Certification"}
          </Button>
        </form>
      </Modal>

      {/* Upload Verified Document Modal */}
      <Modal isOpen={isDocModalOpen} onClose={() => { setIsDocModalOpen(false); setDocError(''); }} title="Upload Verified Document">
        <form onSubmit={handleUploadVerifiedDoc} className="space-y-4">
          {docError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p>{docError}</p>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Document Type</label>
            <select
              value={docForm.documentType}
              onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value, title: VERIFIED_DOCUMENT_TYPES.find(d => d.type === e.target.value)?.label || '' })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
            >
              {VERIFIED_DOCUMENT_TYPES.map(d => (
                <option key={d.type} value={d.type}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Document Title</label>
            <input
              required
              value={docForm.title}
              onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. National ID Card"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Document / ID Number (Optional)</label>
            <input
              value={docForm.documentNumber}
              onChange={(e) => setDocForm({ ...docForm, documentNumber: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. 12345678"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Document File (PDF or Image) *</label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                docFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => docFileRef.current?.click()}
            >
              <input
                ref={docFileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              />
              {docFile ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-semibold">{docFile.name}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-500">Click to select a file (PDF, JPG, PNG)</p>
                </div>
              )}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/80">Documents are stored securely and not publicly visible. Only recruiters with a valid one-time key can view them.</p>
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={docUploading} leftIcon={<Upload className="w-4 h-4" />}>
            Upload Document Securely
          </Button>
        </form>
      </Modal>

      {/* Generate Access Key Modal */}
      <Modal isOpen={isKeyModalOpen} onClose={() => { setIsKeyModalOpen(false); setNewKey(null); }} title="Generate Recruiter Access Key">
        {!newKey ? (
          <form onSubmit={handleGenerateKey} className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2">
              <Key className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-300/80">This key grants one-time access to your verified documents. It expires after the set validity period and cannot be reused once accessed.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Recipient Name (Optional)</label>
              <input
                value={keyForm.recipientName}
                onChange={(e) => setKeyForm({ ...keyForm, recipientName: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="e.g. ABC Company HR"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Recipient Email (Optional)</label>
              <input
                type="email"
                value={keyForm.recipientEmail}
                onChange={(e) => setKeyForm({ ...keyForm, recipientEmail: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="e.g. hr@company.com (auto-dispatches key via Mail Gateway 1)"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Key Validity</label>
              <select
                value={keyForm.validityHours}
                onChange={(e) => setKeyForm({ ...keyForm, validityHours: parseInt(e.target.value) })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              >
                <option value={6}>6 hours</option>
                <option value={24}>24 hours (1 day)</option>
                <option value={48}>48 hours (2 days)</option>
                <option value={72}>72 hours (3 days)</option>
              </select>
            </div>
            <Button type="submit" variant="primary" className="w-full" isLoading={keyLoading} leftIcon={<Key className="w-4 h-4" />}>
              Generate One-Time Key
            </Button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-emerald-300">Access Key Generated!</p>
              {keyForm.recipientEmail && (
                <p className="text-xs text-emerald-400/90 font-medium">
                  Dispatched directly to {keyForm.recipientEmail} via Mail Gateway 1 from your account email.
                </p>
              )}
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
              <p className="text-xs text-slate-400">Share this key with the recruiter:</p>
              <code className="text-2xl font-extrabold tracking-[0.3em] text-white font-mono block">{newKey.code}</code>
              <div className="text-xs text-slate-500 space-y-0.5">
                {newKey.recipientName && <p className="flex items-center justify-center gap-1"><User className="w-3 h-3" />{newKey.recipientName}</p>}
                <p className="flex items-center justify-center gap-1"><Clock className="w-3 h-3" />Expires: {new Date(newKey.expiresAt).toLocaleString()}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => copyKey(newKey.code)}
              leftIcon={keyCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {keyCopied ? 'Copied to Clipboard!' : 'Copy Key to Clipboard'}
            </Button>
            <p className="text-[11px] text-center text-slate-500">Close this dialog when done. This key has been saved and will appear in your keys list above.</p>
            <Button variant="primary" className="w-full" onClick={() => { setIsKeyModalOpen(false); fetchProfile(); setNewKey(null); }}>
              Done
            </Button>
          </div>
        )}
      </Modal>

      {/* Add / Edit Referee Modal */}
      <Modal
        isOpen={isRefModalOpen}
        onClose={() => setIsRefModalOpen(false)}
        title={editingRefId ? "Edit Referee" : "Add Referee"}
      >
        <form onSubmit={handleSaveReference} className="space-y-4">
          {refError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {refError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Full Name *</label>
              <input
                required
                value={refForm.name}
                onChange={(e) => setRefForm({ ...refForm, name: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="e.g. Jane Smith"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Job Title / Position</label>
              <input
                value={refForm.position}
                onChange={(e) => setRefForm({ ...refForm, position: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="e.g. Senior Manager"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Organization / Company</label>
            <input
              value={refForm.organization}
              onChange={(e) => setRefForm({ ...refForm, organization: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. Acme Corp Ltd"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Email Address</label>
              <input
                type="email"
                value={refForm.email}
                onChange={(e) => setRefForm({ ...refForm, email: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="jane@company.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Phone Number</label>
              <input
                type="tel"
                value={refForm.phone}
                onChange={(e) => setRefForm({ ...refForm, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="+254 700 000000"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold">Relationship / Context</label>
            <input
              value={refForm.relationship}
              onChange={(e) => setRefForm({ ...refForm, relationship: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. Former Supervisor, Academic Advisor"
            />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <input
              type="checkbox"
              id="refIsPublic"
              checked={refForm.isPublic}
              onChange={(e) => setRefForm({ ...refForm, isPublic: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600"
            />
            <label htmlFor="refIsPublic" className="text-xs text-slate-300 font-medium cursor-pointer flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              Show referee details on my public portfolio
            </label>
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={isSavingRef} leftIcon={<Check className="w-4 h-4" />}>
            {editingRefId ? "Update Referee" : "Save Referee"}
          </Button>
        </form>
      </Modal>

      {/* OCR CV scan and profile import modal */}
      <Modal
        isOpen={isAiCvModalOpen}
        onClose={() => {
          setIsAiCvModalOpen(false);
          setCvScanError('');
          setCvApplyMessage('');
        }}
        title="CV OCR Scanner & Profile Auto-Fill"
      >
        <div className="space-y-6 max-h-[82vh] overflow-y-auto pr-1">
          {/* Header Info */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Upload Your Resume & Fill Your Profile</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                The local CV parser reads PDF files (including scanned PDFs through OCR), Word DOC/DOCX, and TXT resumes, then extracts work history, education, skills, projects, and contact details into your Profile Editor tabs.
              </p>
            </div>
          </div>

          {cvApplyMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{cvApplyMessage}</span>
            </div>
          )}

          {cvScanError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{cvScanError}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          <form onSubmit={handleScanCv} className="space-y-4">
            <div
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                cvFile ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/60'
              }`}
              onClick={() => cvFileInputRef.current?.click()}
            >
              <input
                ref={cvFileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCvFile(e.target.files[0]);
                  }
                }}
              />
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {cvFile ? cvFile.name : 'Click or Drag & Drop CV File Here'}
                  </p>
                  <p className="text-xs text-slate-400">Supports PDF (including scans), Word (DOC/DOCX), or TXT (up to 10MB)</p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full bg-indigo-600 hover:bg-indigo-500"
              isLoading={isCvScanning}
              disabled={!cvFile || isCvScanning}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {isCvScanning ? 'Scanning & Extracting Document...' : 'Scan & Extract'}
            </Button>
          </form>

          {/* Extracted Data Preview & Selection */}
          {extractedCv && (
            <div className="space-y-5 pt-4 border-t border-slate-800 animate-in fade-in">
              {/* Accuracy Disclaimer Banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">AI Extraction — Verify Before Applying</p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Extracted data is not always 100% accurate. Please review and verify all fields below before applying to your profile.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>OCR Extracted Profile Preview</span>
                  </h4>
                  <p className="text-xs text-slate-400">Select which sections to apply to your Edit Profile tabs.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleResetCvScanner}
                    isLoading={isCvResetting}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-red-400" />}
                    className="border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs py-1.5 px-3 h-auto"
                  >
                    Reset Scanner
                  </Button>
                  {extractedCv?.structuredResume?.meta?.engineUsed === 'gemini' ? (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Gemini Flash
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Heuristic Engine
                    </span>
                  )}
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Ready to Apply
                  </span>
                </div>
              </div>

              {/* Candidate Quick Summary Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-white">{extractedCv.personalInfo?.fullName || 'Extracted Candidate'}</p>
                    <p className="text-xs text-indigo-400 font-medium">{extractedCv.personalInfo?.title || 'Professional Title'}</p>
                  </div>
                  {extractedCv.personalInfo?.location && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {extractedCv.personalInfo.location}
                    </span>
                  )}
                </div>
                {extractedCv.headline && (
                  <p className="text-xs text-slate-300 italic border-l-2 border-indigo-500/50 pl-2.5 my-1">
                    "{extractedCv.headline}"
                  </p>
                )}
              </div>

              {/* Section Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Choose Sections to Auto-Fill:</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCvSections({
                        general: true,
                        contacts: true,
                        experience: true,
                        education: true,
                        skills: true,
                        certifications: true,
                        languages: true,
                        references: true,
                      })}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600 text-xs">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCvSections({
                        general: false,
                        contacts: false,
                        experience: false,
                        education: false,
                        skills: false,
                        certifications: false,
                        languages: false,
                        references: false,
                      })}
                      className="text-[11px] text-slate-400 hover:text-slate-200 font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'general', label: 'General Bio & Headline' },
                    { key: 'contacts', label: 'Contact & Socials' },
                    { key: 'experience', label: `Experience (${extractedCv.experiences?.length || 0})` },
                    { key: 'education', label: `Education (${extractedCv.education?.length || 0})` },
                    { key: 'skills', label: `Skills (${extractedCv.skills?.length || 0})` },
                    { key: 'certifications', label: `Certifications (${extractedCv.certifications?.length || 0})` },
                    { key: 'languages', label: `Languages (${extractedCv.languages?.length || 0})` },
                    { key: 'references', label: `Referees (${extractedCv.references?.length || 0})` },
                  ].map((sec) => (
                    <label
                      key={sec.key}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                        selectedCvSections[sec.key]
                          ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(selectedCvSections[sec.key])}
                        onChange={(e) =>
                          setSelectedCvSections({
                            ...selectedCvSections,
                            [sec.key]: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium truncate">{sec.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview Tabs inside Modal */}
              <div className="space-y-3">
                <div className="flex border-b border-slate-800 gap-2 text-xs font-semibold text-slate-400 overflow-x-auto pb-1">
                  {['general', 'contacts', 'experience', 'education', 'skills', 'certifications', 'languages', 'references'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCvActivePreviewTab(t)}
                      className={`capitalize whitespace-nowrap pb-1 border-b-2 transition ${
                        cvActivePreviewTab === t
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Tab Panel Content */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5 max-h-48 overflow-y-auto">
                  {cvActivePreviewTab === 'general' && (
                    <div className="space-y-1.5">
                      <p><span className="text-slate-500 font-semibold">Title:</span> <span className="text-white">{extractedCv.personalInfo?.title || 'None'}</span></p>
                      <p><span className="text-slate-500 font-semibold">Headline:</span> <span className="text-white">{extractedCv.headline || 'None'}</span></p>
                      <p><span className="text-slate-500 font-semibold">Summary:</span> <span className="text-slate-300 block mt-1 leading-relaxed bg-slate-900 p-2.5 rounded-lg">{extractedCv.summary || 'None'}</span></p>
                    </div>
                  )}

                  {cvActivePreviewTab === 'contacts' && (
                    <div className="space-y-1.5">
                      <p><span className="text-slate-500 font-semibold">Email:</span> <span className="text-white">{extractedCv.personalInfo?.email || 'None'}</span></p>
                      <p><span className="text-slate-500 font-semibold">Phone:</span> <span className="text-white">{extractedCv.personalInfo?.phone || 'None'}</span></p>
                      <p><span className="text-slate-500 font-semibold">Location:</span> <span className="text-white">{extractedCv.personalInfo?.location || 'None'}</span></p>
                      <p><span className="text-slate-500 font-semibold">Website:</span> <span className="text-indigo-400">{extractedCv.personalInfo?.website || 'None'}</span></p>
                      <p><span className="text-slate-500 font-semibold">LinkedIn:</span> <span className="text-indigo-400">{extractedCv.personalInfo?.linkedin || 'None'}</span></p>
                      <p><span className="text-slate-500 font-semibold">GitHub:</span> <span className="text-indigo-400">{extractedCv.personalInfo?.github || 'None'}</span></p>
                    </div>
                  )}

                  {cvActivePreviewTab === 'experience' && (
                    <div className="space-y-2.5">
                      {extractedCv.experiences?.map((exp: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <div className="flex justify-between font-bold text-white">
                            <span>{exp.position}</span>
                            <span className="text-slate-400 font-mono text-[11px]">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}</span>
                          </div>
                          <p className="text-indigo-300">{exp.company} {exp.location ? `• ${exp.location}` : ''}</p>
                          <p className="text-slate-400 text-[11px]">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {cvActivePreviewTab === 'education' && (
                    <div className="space-y-2.5">
                      {extractedCv.education?.map((edu: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <p className="font-bold text-white">{edu.qualification} in {edu.field}</p>
                          <p className="text-slate-400">{edu.institution} ({edu.startDate} – {edu.endDate || 'Present'})</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {cvActivePreviewTab === 'skills' && (() => {
                    const allSkills = extractedCv.skills || [];
                    const techSkills = allSkills.filter((s: any) => {
                      const cat = typeof s === 'string' ? 'Technical' : (s.category || 'Technical');
                      return cat !== 'Soft';
                    });
                    const softSkills = allSkills.filter((s: any) => {
                      const cat = typeof s === 'string' ? 'Technical' : (s.category || 'Technical');
                      return cat === 'Soft';
                    });
                    const renderSkill = (s: any, idx: number, accent: string) => (
                      <span key={idx} className={`px-2.5 py-1 rounded-md bg-slate-950 border ${accent} text-slate-200 text-xs font-medium`}>
                        {typeof s === 'string' ? s : s.name}
                      </span>
                    );
                    return (
                      <div className="space-y-4">
                        {techSkills.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                              <span className="w-1 h-3 rounded-full bg-indigo-400 inline-block" />
                              Technical Skills &amp; Stack
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {techSkills.map((s: any, idx: number) => renderSkill(s, idx, 'border-indigo-500/30'))}
                            </div>
                          </div>
                        )}
                        {softSkills.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                              <span className="w-1 h-3 rounded-full bg-emerald-400 inline-block" />
                              Soft Skills &amp; Interpersonal
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {softSkills.map((s: any, idx: number) => renderSkill(s, idx, 'border-emerald-500/30'))}
                            </div>
                          </div>
                        )}
                        {allSkills.length === 0 && (
                          <p className="text-xs text-slate-500 italic">No skills extracted from CV.</p>
                        )}
                      </div>
                    );
                  })()}

                  {cvActivePreviewTab === 'certifications' && (
                    <div className="space-y-2.5">
                      {extractedCv.certifications?.map((c: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <p className="font-bold text-white">{c.name}</p>
                          <p className="text-slate-400">{c.issuingOrganization} ({c.issueDate})</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {cvActivePreviewTab === 'languages' && (
                    <div className="flex flex-wrap gap-1.5">
                      {extractedCv.languages?.length ? extractedCv.languages.map((lang: any, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-200">
                          {lang.language}{lang.proficiency ? ` · ${lang.proficiency}` : ''}
                        </span>
                      )) : <p className="text-slate-500">No languages detected in this resume.</p>}
                    </div>
                  )}

                  {cvActivePreviewTab === 'references' && (
                    <div className="space-y-2.5">
                      {extractedCv.references?.length ? extractedCv.references.map((ref: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                          <p className="font-bold text-white">{ref.name}</p>
                          <p className="text-indigo-400">{ref.position} — {ref.organization}</p>
                          {ref.email && <p className="text-slate-400">{ref.email}</p>}
                          {ref.phone && <p className="text-slate-400">{ref.phone}</p>}
                        </div>
                      )) : <p className="text-slate-500">No referees detected in this resume.</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Import Mode Strategy */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-300">Import Strategy:</p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={cvImportMode === 'replace'}
                      onChange={() => setCvImportMode('replace')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span><strong>Clean Replace</strong> — Replace selected profile tabs with newly scanned data (Recommended)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={cvImportMode === 'append'}
                      onChange={() => setCvImportMode('append')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span><strong>Append Mode</strong> — Add scanned items alongside existing items without overwriting</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAiCvModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleApplyCvToProfile}
                  isLoading={isApplyingCv}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-6"
                  leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                >
                  {isApplyingCv ? 'Applying to Profile...' : '✨ Apply Selected to Profile'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Reset Profile Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Profile to Empty State"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Are you sure you want to reset your profile?</span>
            </div>
            <p className="text-xs text-red-300/90 leading-relaxed">
              This action will clear all your profile tabs and restore your account to an empty profile template.
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="font-semibold text-slate-300">The following will be deleted / cleared:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>General Bio, Title, Headline &amp; Summary</li>
              <li>Contact details &amp; social media links</li>
              <li>All Work Experience entries ({profile?.experiences?.length || 0})</li>
              <li>All Education records ({profile?.educations?.length || 0})</li>
              <li>All Skills ({profile?.skills?.length || 0})</li>
              <li>All Projects ({profile?.projects?.length || 0})</li>
              <li>All Certifications ({profile?.certifications?.length || 0})</li>
              <li>Avatar &amp; Cover banner images</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsResetModalOpen(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleResetProfile}
              isLoading={isResetting}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              {isResetting ? 'Resetting Profile...' : 'Yes, Reset Profile'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
