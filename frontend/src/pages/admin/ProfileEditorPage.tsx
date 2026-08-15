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
} from "lucide-react";
import { ImageUploadWidget } from "../../components/ui/ImageUploadWidget";

export const ProfileEditorPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "general"
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
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    demoUrl: "",
    githubUrl: "",
    technologies: "React, TypeScript",
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
        location: res.data.location || "",
        phone: res.data.phone || "",
        github: res.data.github || "",
        linkedin: res.data.linkedin || "",
        twitter: res.data.twitter || "",
        website: res.data.website || "",
        avatarUrl: res.data.avatarUrl || "",
        coverUrl: res.data.coverUrl || "",
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
      const res: any = await api.put("/profile", generalState);
      // Update profile in state immediately for live changes
      const updated = res?.data ?? res;
      if (updated) {
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
      console.error(e);
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

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/profile/projects", {
        ...newProject,
        technologies: newProject.technologies.split(",").map((t) => t.trim()),
      });
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
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Profile Data Editor
        </h1>
        <p className="text-slate-400 text-sm">
          Manage your bio, experience, education, skills, projects, and
          certifications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold text-slate-400 overflow-x-auto">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "general" ? "border-indigo-500 text-white" : "border-transparent hover:text-white"}`}
        >
          General Bio
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
                value={generalState.avatarUrl || ''}
                onChange={(url) => setGeneralState({ ...generalState, avatarUrl: url })}
                aspectRatio="square"
              />
            </div>
            <div className="md:col-span-2">
              <ImageUploadWidget
                label="Header Cover Banner"
                value={generalState.coverUrl || ''}
                onChange={(url) => setGeneralState({ ...generalState, coverUrl: url })}
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
            <h3 className="text-lg font-bold text-white">Projects</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsProjectModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Project
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {profile?.projects?.map((proj: any) => (
              <div
                key={proj.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">
                    {proj.title}
                  </h4>
                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">{proj.description}</p>
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

      {/* Project Add Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Add Project"
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Project Title</label>
            <input
              required
              value={newProject.title}
              onChange={(e) =>
                setNewProject({ ...newProject, title: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Description</label>
            <textarea
              required
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"
            />
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Save Project
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
