import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { ImageUploadWidget } from "../../components/ui/ImageUploadWidget";

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
  >("general");

  // General Form State
  const [generalState, setGeneralState] = useState<any>({});
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // New Item Modals
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
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
  const [newEdu, setNewEdu] = useState({
    institution: "",
    qualification: "",
    field: "",
    startDate: "",
    endDate: "",
    grade: "",
  });

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "Technical",
    proficiency: 90,
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
  const [newCert, setNewCert] = useState({
    name: "",
    issuingOrganization: "",
    issueDate: "",
    credentialUrl: "",
  });

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
      // api interceptor returns response.data (the envelope):
      // { success: true, message: '...', data: <full profile object> }
      const envelope: any = await api.put('/profile', generalState);
      const updated = envelope?.data ?? envelope;
      if (updated && typeof updated === 'object') {
        setProfile(updated);
        // Sync image URLs back in case they were updated server-side
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

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/profile/experiences", newExp);
      setIsExpModalOpen(false);
      setNewExp({
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
      });
      fetchProfile();
    } catch (e) {
      console.error(e);
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

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/profile/educations", newEdu);
      setIsEduModalOpen(false);
      setNewEdu({
        institution: "",
        qualification: "",
        field: "",
        startDate: "",
        endDate: "",
        grade: "",
      });
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
    try {
      await api.post("/profile/skills", newSkill);
      setIsSkillModalOpen(false);
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

  const handleAddCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/profile/certifications", newCert);
      setIsCertModalOpen(false);
      setNewCert({
        name: "",
        issuingOrganization: "",
        issueDate: "",
        credentialUrl: "",
      });
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

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Profile Data Editor
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          Manage your bio, experience, education, skills, projects, and
          certifications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-400 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "general" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}
        >
          General Bio
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "contacts" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}
        >
          Contact & Social
        </button>
        <button
          onClick={() => setActiveTab("experience")}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "experience" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}
        >
          Work Experience ({profile?.experiences?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("education")}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "education" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}
        >
          Education ({profile?.educations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("skills")}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "skills" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}
        >
          Skills ({profile?.skills?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "projects" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}
        >
          Projects ({profile?.projects?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("certifications")}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "certifications" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}
        >
          Certifications ({profile?.certifications?.length || 0})
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
            <label className="text-xs font-semibold text-slate-300">
              Summary
            </label>
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
                <h3 className="text-base font-bold text-white">Portfolio Message Forwarding & Email</h3>
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
                  <span>Display contact email address publicly on portfolio footer & contact section</span>
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
                <h3 className="text-base font-bold text-white">Phone & Location Details</h3>
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
                  <h3 className="text-base font-bold text-white">Social Media & Portfolio Links</h3>
                  <p className="text-xs text-slate-400">Connect your public developer & professional profiles.</p>
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
            <h3 className="text-lg font-bold text-white">Work Experience</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsExpModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Experience
            </Button>
          </div>

          <div className="space-y-4">
            {profile?.experiences?.map((exp: any) => (
              <div
                key={exp.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-base font-bold text-white">
                    {exp.position} — {exp.company}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
              onClick={() => setIsEduModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Education
            </Button>
          </div>

          <div className="space-y-4">
            {profile?.educations?.map((edu: any) => (
              <div
                key={edu.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-base font-bold text-white">
                    {edu.qualification} in {edu.field} — {edu.institution}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {edu.startDate} – {edu.endDate || "Present"}{" "}
                    {edu.grade ? `(${edu.grade})` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === "skills" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Skills</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSkillModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Skill
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            {profile?.skills?.map((skill: any) => (
              <div
                key={skill.id}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3 text-sm text-white"
              >
                <span>
                  {skill.name} ({skill.proficiency}%)
                </span>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
              onClick={() => setIsCertModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Certification
            </Button>
          </div>

          <div className="space-y-4">
            {profile?.certifications?.map((cert: any) => (
              <div
                key={cert.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-base font-bold text-white">
                    {cert.name} — {cert.issuingOrganization}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Issued: {cert.issueDate}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCertification(cert.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience Add Modal */}
      <Modal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        title="Add Work Experience"
      >
        <form onSubmit={handleAddExperience} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Company</label>
            <input
              required
              value={newExp.company}
              onChange={(e) =>
                setNewExp({ ...newExp, company: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Position</label>
            <input
              required
              value={newExp.position}
              onChange={(e) =>
                setNewExp({ ...newExp, position: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Start Date</label>
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
              <label className="text-xs text-slate-300">End Date</label>
              <input
                value={newExp.endDate}
                onChange={(e) =>
                  setNewExp({ ...newExp, endDate: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="Present"
              />
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Save Experience
          </Button>
        </form>
      </Modal>

      {/* Education Add Modal */}
      <Modal
        isOpen={isEduModalOpen}
        onClose={() => setIsEduModalOpen(false)}
        title="Add Education"
      >
        <form onSubmit={handleAddEducation} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Institution / University
            </label>
            <input
              required
              value={newEdu.institution}
              onChange={(e) =>
                setNewEdu({ ...newEdu, institution: e.target.value })
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
                value={newEdu.qualification}
                onChange={(e) =>
                  setNewEdu({ ...newEdu, qualification: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="e.g. Bachelor of Science"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Field of Study</label>
              <input
                required
                value={newEdu.field}
                onChange={(e) =>
                  setNewEdu({ ...newEdu, field: e.target.value })
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
                value={newEdu.startDate}
                onChange={(e) =>
                  setNewEdu({ ...newEdu, startDate: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="2018"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">End Date</label>
              <input
                value={newEdu.endDate}
                onChange={(e) =>
                  setNewEdu({ ...newEdu, endDate: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
                placeholder="2022"
              />
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Save Education
          </Button>
        </form>
      </Modal>

      {/* Skill Add Modal */}
      <Modal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        title="Add Skill"
      >
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Skill Name</label>
            <input
              required
              value={newSkill.name}
              onChange={(e) =>
                setNewSkill({ ...newSkill, name: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
            />
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

      {/* Certification Add Modal */}
      <Modal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title="Add Certification"
      >
        <form onSubmit={handleAddCertification} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Certification Name</label>
            <input
              required
              value={newCert.name}
              onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
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
              value={newCert.issuingOrganization}
              onChange={(e) =>
                setNewCert({ ...newCert, issuingOrganization: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="e.g. Amazon Web Services"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Issue Date</label>
            <input
              required
              value={newCert.issueDate}
              onChange={(e) =>
                setNewCert({ ...newCert, issueDate: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
              placeholder="2023-05"
            />
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Save Certification
          </Button>
        </form>
      </Modal>
    </div>
  );
};
