import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Lock,
  Building,
  User,
  Phone,
  FileText,
  Clock,
  CheckCircle2,
  Archive,
  Trash2,
  Edit3,
  ArrowRight,
  ShieldAlert,
  Eye,
  RefreshCw,
  HardHat,
  Award,
} from 'lucide-react';
import { AuthUser } from '../types';
import {
  ProjectItem,
  ProjectExecutionStatus,
  ProjectStage,
  DEFAULT_PROJECT_STAGES,
  InspectionItem,
  DiscrepancyItem,
  DiscrepancyStatus,
  InspectionReportItem,
} from '../types/project';
import {
  getCurrentJalaliDate,
  getCurrentPersianDateTime,
  evaluateContractStatus,
  normalizePersianDigits,
} from '../utils/jalaliDate';
import { toPersianDigits } from '../utils/formatters';
import { calculateProjectWbsProgress } from '../utils/wbsProgress';
import { generateProjectStages } from '../utils/stageGenerator';
import { ProjectStagesTimeline } from './projects/ProjectStagesTimeline';
import { InspectionControlsCard } from './projects/InspectionControlsCard';
import { DiscrepancyLifecycleCard } from './projects/DiscrepancyLifecycleCard';
import { InspectionReportsList } from './projects/InspectionReportsList';
import { InspectionReportModal } from './projects/InspectionReportModal';
import { VisitReportModal } from './projects/VisitReportModal';
import { ComprehensiveProjectReportModal } from './projects/ComprehensiveProjectReportModal';

interface ProjectsViewProps {
  currentUser?: AuthUser | null;
  onOpenLogin?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  currentUser,
  onOpenLogin,
}) => {
  const [projectSubTab, setProjectSubTab] = useState<'current' | 'archived'>('current');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectExecutionStatus>('all');

  // Selected project for dossier view
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Selected stage for inspection within project (1 to 22)
  const [selectedStageId, setSelectedStageId] = useState<number>(1);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [terminateModalProject, setTerminateModalProject] = useState<ProjectItem | null>(null);
  const [terminationNoteInput, setTerminationNoteInput] = useState('');
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<ProjectItem | null>(null);
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);
  const [isVisitReportModalOpen, setIsVisitReportModalOpen] = useState(false);
  const [isComprehensiveReportOpen, setIsComprehensiveReportOpen] = useState(false);
  const [isStagesManuallyOpen, setIsStagesManuallyOpen] = useState(false);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formContractNumber, setFormContractNumber] = useState('');
  const [formContractStartDate, setFormContractStartDate] = useState('');
  const [formContractEndDate, setFormContractEndDate] = useState('');
  const [formLicenseNumber, setFormLicenseNumber] = useState('');
  const [formEmployerName, setFormEmployerName] = useState('');
  const [formEmployerPhone, setFormEmployerPhone] = useState('');
  const [formSupervisorName, setFormSupervisorName] = useState('');
  const [formSupervisorPhone, setFormSupervisorPhone] = useState('');
  const [formStructuralDesignerName, setFormStructuralDesignerName] = useState('');
  const [formStructuralDesignerPhone, setFormStructuralDesignerPhone] = useState('');
  const [formStructureType, setFormStructureType] = useState('بتنی');
  const [formFloorsCount, setFormFloorsCount] = useState<string>('5');
  const [formTotalArea, setFormTotalArea] = useState<string>('800');
  const [formProjectStatus, setFormProjectStatus] = useState<ProjectExecutionStatus>('active');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Projects strictly for current user
  const fetchUserProjects = async () => {
    if (!currentUser?.username) {
      setProjects([]);
      setSelectedProjectId(null);
      return;
    }
    setIsLoading(true);
    const expectedUserId = currentUser.username.trim().toLowerCase();
    try {
      const res = await fetch(`/api/projects?userId=${encodeURIComponent(currentUser.username)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        // Strict user boundary: only keep projects that strictly match current user
        const strictlyUserProjects = data.projects.filter(
          (p: ProjectItem) => String(p.userId || '').trim().toLowerCase() === expectedUserId
        );
        setProjects(strictlyUserProjects);
        localStorage.setItem(`urmia_user_projects_${currentUser.username}`, JSON.stringify(strictlyUserProjects));
      } else {
        const local = localStorage.getItem(`urmia_user_projects_${currentUser.username}`);
        if (local) {
          const parsed = JSON.parse(local);
          const filtered = Array.isArray(parsed)
            ? parsed.filter((p: ProjectItem) => String(p.userId || '').trim().toLowerCase() === expectedUserId)
            : [];
          setProjects(filtered);
        }
      }
    } catch {
      const local = localStorage.getItem(`urmia_user_projects_${currentUser.username}`);
      if (local) {
        const parsed = JSON.parse(local);
        const filtered = Array.isArray(parsed)
          ? parsed.filter((p: ProjectItem) => String(p.userId || '').trim().toLowerCase() === expectedUserId)
          : [];
        setProjects(filtered);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedProjectId(null);
    if (!currentUser?.username) {
      setProjects([]);
    } else {
      fetchUserProjects();
    }
  }, [currentUser?.username]);

  // Open Create Form
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    const today = getCurrentJalaliDate().formatted;
    setFormName('');
    setFormAddress('');
    setFormContractNumber('');
    setFormContractStartDate(today);
    setFormContractEndDate('');
    setFormLicenseNumber('');
    setFormEmployerName('');
    setFormEmployerPhone('');
    setFormSupervisorName('');
    setFormSupervisorPhone('');
    setFormStructuralDesignerName('');
    setFormStructuralDesignerPhone('');
    setFormStructureType('بتنی');
    setFormFloorsCount('5');
    setFormTotalArea('800');
    setFormProjectStatus('active');
    setFormDescription('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditModal = (proj: ProjectItem) => {
    if (proj.isArchived || proj.contractStatus === 'terminated') {
      alert('این پروژه بایگانی شده و اطلاعات آن فقط خواندنی است.');
      return;
    }
    setEditingProject(proj);
    setFormName(proj.name || '');
    setFormAddress(proj.address || '');
    setFormContractNumber(proj.contractNumber || '');
    setFormContractStartDate(proj.contractStartDate || '');
    setFormContractEndDate(proj.contractEndDate || '');
    setFormLicenseNumber(proj.licenseNumber || '');
    setFormEmployerName(proj.employerName || '');
    setFormEmployerPhone(proj.employerPhone || '');
    setFormSupervisorName(proj.supervisorName || '');
    setFormSupervisorPhone(proj.supervisorPhone || '');
    setFormStructuralDesignerName(proj.structuralDesignerName || '');
    setFormStructuralDesignerPhone(proj.structuralDesignerPhone || '');
    setFormStructureType(proj.structureType || 'بتنی');
    setFormFloorsCount(String(proj.floorsCount || '1'));
    setFormTotalArea(String(proj.totalArea || '0'));
    setFormProjectStatus(proj.projectStatus || 'active');
    setFormDescription(proj.description || '');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Save Project (Create or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.username) return;
    if (!formName.trim()) {
      setFormError('لطفاً نام پروژه را وارد نمایید.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const contractEval = evaluateContractStatus(
      formContractEndDate,
      editingProject ? editingProject.isArchived : false
    );

    // Initial stages adapted to building floors count and structure type
    const floors = Math.max(1, Number(formFloorsCount) || 1);
    const initialStages: ProjectStage[] =
      editingProject?.stages &&
      editingProject.stages.length > 0 &&
      Number(editingProject.floorsCount) === floors &&
      editingProject.structureType === formStructureType
        ? editingProject.stages
        : generateProjectStages(floors, formStructureType);

    const payload = {
      id: editingProject ? editingProject.id : undefined,
      userId: currentUser.username,
      name: formName.trim(),
      address: formAddress.trim(),
      contractNumber: formContractNumber.trim(),
      contractStartDate: formContractStartDate.trim(),
      contractEndDate: formContractEndDate.trim(),
      licenseNumber: formLicenseNumber.trim(),
      employerName: formEmployerName.trim(),
      employerPhone: formEmployerPhone.trim(),
      supervisorName: formSupervisorName.trim(),
      supervisorPhone: formSupervisorPhone.trim(),
      structuralDesignerName: formStructuralDesignerName.trim(),
      structuralDesignerPhone: formStructuralDesignerPhone.trim(),
      structureType: formStructureType,
      floorsCount: Number(formFloorsCount) || 1,
      totalArea: Number(formTotalArea) || 0,
      projectStatus: formProjectStatus,
      contractStatus: contractEval.status,
      currentStageId: editingProject?.currentStageId || 1,
      stages: initialStages,
      inspections: editingProject?.inspections || [],
      discrepancies: editingProject?.discrepancies || [],
      reports: editingProject?.reports || [],
      description: formDescription.trim(),
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.project) {
        setIsFormModalOpen(false);
        await fetchUserProjects();
        if (editingProject && selectedProjectId === editingProject.id) {
          setSelectedProjectId(data.project.id);
        }
      } else {
        setFormError(data.error || 'خطا در ثبت اطلاعات پروژه.');
      }
    } catch (err: any) {
      setFormError('خطا در برقراری ارتباط با سرور: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to persist updated project object with instant optimistic UI update
  const persistProjectUpdate = (updatedProject: ProjectItem) => {
    if (!currentUser?.username) return;

    const securedProject: ProjectItem = {
      ...updatedProject,
      userId: currentUser.username,
    };

    // 1. Immediately update local state so UI reacts in 1 millisecond!
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === securedProject.id ? securedProject : p));
      localStorage.setItem(`urmia_user_projects_${currentUser.username}`, JSON.stringify(next));
      return next;
    });

    // 2. Persist to server in background without blocking UI thread
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(securedProject),
    }).catch((err) => {
      console.error('Error updating project:', err);
    });
  };

  // Selected project object
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Ensure stages array exists for selected project based on floor count and structure type
  const projectStages = useMemo(() => {
    if (!selectedProject) return [];
    const isSteel =
      (selectedProject.structureType || '').includes('فولاد') ||
      (selectedProject.structureType || '').includes('فلز') ||
      (selectedProject.structureType || '').toLowerCase().includes('steel');

    if (selectedProject.stages && selectedProject.stages.length > 0) {
      const hasConcreteStages = selectedProject.stages.some((s) => s.name.includes('آرماتوربندی ستون'));
      const hasSteelStages = selectedProject.stages.some(
        (s) => s.name.includes('ستون‌های فولادی') || s.name.includes('بیس‌پلیت') || s.name.includes('عرشه فولادی')
      );

      // If mismatch between saved stages and current structureType, regenerate to match structureType!
      if (isSteel && hasConcreteStages && !hasSteelStages) {
        return generateProjectStages(selectedProject.floorsCount || 1, selectedProject.structureType);
      }
      if (!isSteel && hasSteelStages) {
        return generateProjectStages(selectedProject.floorsCount || 1, selectedProject.structureType);
      }
      return selectedProject.stages;
    }
    return generateProjectStages(selectedProject.floorsCount || 1, selectedProject.structureType);
  }, [selectedProject]);

  const currentStageName = useMemo(() => {
    return projectStages.find((s: ProjectStage) => s.id === selectedStageId)?.name || 'مرحله کارگاهی';
  }, [projectStages, selectedStageId]);

  // Check if all stages of project are completed
  const allStagesCompleted = useMemo(() => {
    return projectStages.length > 0 && projectStages.every((s: ProjectStage) => s.status === 'completed');
  }, [projectStages]);

  // Complete Stage Handler (Advances stage immediately on click)
  const handleCompleteStage = (stageId: number) => {
    if (!selectedProject || selectedProject.isArchived) return;

    const totalCount = projectStages.length;
    const isLastStage = stageId === totalCount;
    const nextStageId = isLastStage ? stageId : stageId + 1;

    const updatedStages = projectStages.map((s: ProjectStage) => {
      if (s.id === stageId) {
        return { ...s, status: 'completed' as const, completedAt: getCurrentPersianDateTime() };
      }
      if (s.id === nextStageId && s.status !== 'completed') {
        return { ...s, status: 'in_progress' as const };
      }
      return s;
    });

    const isAllDone = updatedStages.every((s) => s.status === 'completed');

    const updatedProject: ProjectItem = {
      ...selectedProject,
      currentStageId: nextStageId,
      stages: updatedStages,
      projectStatus: isAllDone ? 'completed' : selectedProject.projectStatus,
    };

    persistProjectUpdate(updatedProject);
    setSelectedStageId(nextStageId);

    if (isAllDone) {
      setIsStagesManuallyOpen(false);
    } else {
      // Smoothly scroll to show the first control item of the new stage
      setTimeout(() => {
        const el = document.getElementById('stage-inspection-card');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  // Add Inspection Item & optional Discrepancy (Instant response)
  const handleAddInspection = (
    itemData: Omit<InspectionItem, 'id' | 'createdAt'>,
    discrepancyData?: Omit<DiscrepancyItem, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
  ) => {
    if (!selectedProject || selectedProject.isArchived) return;

    const inspId = `insp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let newDiscId: string | undefined = undefined;
    let updatedDiscrepancies = selectedProject.discrepancies || [];

    if (discrepancyData) {
      newDiscId = `disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nowFa = getCurrentPersianDateTime();
      const newDisc: DiscrepancyItem = {
        ...discrepancyData,
        id: newDiscId,
        inspectionItemId: inspId,
        statusHistory: [
          {
            previousStatus: 'open',
            newStatus: 'open',
            changedAt: nowFa,
            changedBy: currentUser?.fullName || currentUser?.name || currentUser?.username || 'مجری',
            note: 'ثبت اولیه مغایرت در بازدید کارگاهی',
          },
        ],
        createdAt: nowFa,
        updatedAt: nowFa,
      };
      updatedDiscrepancies = [newDisc, ...updatedDiscrepancies];
    }

    const newInsp: InspectionItem = {
      ...itemData,
      id: inspId,
      discrepancyId: newDiscId,
      createdAt: getCurrentPersianDateTime(),
    };

    const remainingOld = (selectedProject.inspections || []).filter(
      (old) => !(old.stageId === itemData.stageId && old.title.trim() === itemData.title.trim())
    );

    const updatedProject: ProjectItem = {
      ...selectedProject,
      inspections: [newInsp, ...remainingOld],
      discrepancies: updatedDiscrepancies,
    };

    persistProjectUpdate(updatedProject);
  };

  // Instant Bulk Add Inspections Handler
  const handleBulkAddInspections = (
    itemsData: Omit<InspectionItem, 'id' | 'createdAt'>[]
  ) => {
    if (!selectedProject || selectedProject.isArchived || itemsData.length === 0) return;

    const nowFa = getCurrentPersianDateTime();
    const newItems: InspectionItem[] = itemsData.map((it, idx) => ({
      ...it,
      id: `insp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: nowFa,
    }));

    const newKeys = new Set(newItems.map((n) => `${n.stageId}__${n.title.trim()}`));
    const remainingOld = (selectedProject.inspections || []).filter(
      (old) => !newKeys.has(`${old.stageId}__${old.title.trim()}`)
    );

    const updatedProject: ProjectItem = {
      ...selectedProject,
      inspections: [...newItems, ...remainingOld],
    };

    persistProjectUpdate(updatedProject);
  };

  // Update Discrepancy Status
  const handleUpdateDiscrepancyStatus = (
    discrepancyId: string,
    newStatus: DiscrepancyStatus,
    note?: string
  ) => {
    if (!selectedProject || selectedProject.isArchived) return;

    const nowFa = getCurrentPersianDateTime();
    const updatedDiscrepancies = (selectedProject.discrepancies || []).map((d: DiscrepancyItem) => {
      if (d.id === discrepancyId) {
        const history = Array.isArray(d.statusHistory) ? [...d.statusHistory] : [];
        history.push({
          previousStatus: d.status,
          newStatus,
          changedAt: nowFa,
          changedBy: currentUser?.fullName || currentUser?.name || currentUser?.username || 'مجری',
          note: note || (newStatus === 'fixed' ? 'ثبت رفع و اصلاح ایراد' : 'کنترل مجدد و تأیید نهایی'),
        });
        return {
          ...d,
          status: newStatus,
          statusHistory: history,
          updatedAt: nowFa,
        };
      }
      return d;
    });

    const updatedProject: ProjectItem = {
      ...selectedProject,
      discrepancies: updatedDiscrepancies,
    };

    persistProjectUpdate(updatedProject);
  };

  // Save New Inspection Report
  const handleSaveReport = (reportData: Omit<InspectionReportItem, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!selectedProject || selectedProject.isArchived) return;

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReport: InspectionReportItem = {
      ...reportData,
      id: reportId,
      createdAt: getCurrentPersianDateTime(),
      createdBy: currentUser?.fullName || currentUser?.name || currentUser?.username || 'مجری',
    };

    const updatedProject: ProjectItem = {
      ...selectedProject,
      reports: [newReport, ...(selectedProject.reports || [])],
    };

    persistProjectUpdate(updatedProject);
  };

  // Handle Explicit Termination & Permanent Archiving
  const handleConfirmTermination = async () => {
    if (!terminateModalProject || !currentUser?.username) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${terminateModalProject.id}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.username,
          terminationNote: terminationNoteInput.trim() || 'ثبت صریح خاتمه همکاری توسط مجری ذی‌صلاح',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTerminateModalProject(null);
        setTerminationNoteInput('');
        await fetchUserProjects();
      } else {
        alert(data.error || 'خطا در ثبت خاتمه همکاری.');
      }
    } catch (err: any) {
      alert('خطا در برقراری ارتباط: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmProject || !currentUser?.username) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/projects/${deleteConfirmProject.id}?userId=${encodeURIComponent(currentUser.username)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        if (selectedProjectId === deleteConfirmProject.id) {
          setSelectedProjectId(null);
        }
        setDeleteConfirmProject(null);
        await fetchUserProjects();
      } else {
        alert(data.error || 'خطا در حذف پروژه.');
      }
    } catch (err: any) {
      alert('خطا در حذف پروژه: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter projects by active vs archived
  const currentProjects = useMemo(() => {
    return projects.filter((p) => !p.isArchived && p.contractStatus !== 'terminated');
  }, [projects]);

  const archivedProjects = useMemo(() => {
    return projects.filter((p) => p.isArchived || p.contractStatus === 'terminated');
  }, [projects]);

  // Near-expiry contract alert
  const nearExpiryProjects = useMemo(() => {
    return currentProjects.filter((p) => {
      const ev = evaluateContractStatus(p.contractEndDate, p.isArchived);
      return ev.status === 'near_expiry';
    });
  }, [currentProjects]);

  const displayedProjects = useMemo(() => {
    const list = projectSubTab === 'current' ? currentProjects : archivedProjects;
    return list.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.licenseNumber && p.licenseNumber.toLowerCase().includes(q)) ||
        (p.employerName && p.employerName.toLowerCase().includes(q)) ||
        (p.contractNumber && p.contractNumber.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || p.projectStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projectSubTab, currentProjects, archivedProjects, searchQuery, statusFilter]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 pb-24 text-right" dir="rtl">
      {/* Top Header Card (Only in list view to keep single project view ultra compact) */}
      {!selectedProject && (
        <div
          className="p-4 sm:p-5 rounded-2xl text-white shadow-md relative overflow-hidden border border-slate-700/80 bg-[#041432] bg-cover bg-left sm:bg-center"
          style={{ backgroundImage: "url('/blueprint-banner.svg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold">پروژه‌های من</h1>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                    پرونده دیجیتال کنترل کارگاه و گزارش بازدید
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  ثبت بازدید، کنترل میدانی، پیگیری چرخه اصلاح مغایرت‌ها و تنظیم گزارش رسمی کارگاهی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentUser && (
                <button
                  onClick={handleOpenCreateModal}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>تعریف پروژه جدید</span>
                </button>
              )}
              <button
                onClick={fetchUserProjects}
                disabled={isLoading}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="به‌روزرسانی اطلاعات"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Near-Expiry Contract Alerts Banner */}
      {nearExpiryProjects.length > 0 && (
        <div className="space-y-2">
          {nearExpiryProjects.map((p) => {
            const ev = evaluateContractStatus(p.contractEndDate, p.isArchived);
            return (
              <div
                key={p.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex items-center justify-between flex-wrap gap-3 shadow-xs animate-fadeIn"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-950" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      هشدار پایان قرارداد پروژه «{p.name}»
                    </h4>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      تاریخ پایان قرارداد این پروژه نزدیک است. لطفاً وضعیت قرارداد و سوابق پروژه را بررسی کنید.
                      (تنها <strong className="font-mono font-bold text-rose-700">{toPersianDigits(ev.daysRemaining)}</strong> روز باقی مانده است)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProjectId(p.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs transition-colors shadow-2xs"
                >
                  مشاهده پرونده پروژه
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Container */}
      {!currentUser ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              برای مدیریت پرونده‌ها و گزارش‌های بازدید وارد شوید
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              پروژه‌ها به صورت محرمانه بر اساس شناسه کاربری شما نگهداری می‌شوند و تنها با حساب کاربری خودتان قابل دسترس هستند.
            </p>
          </div>
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs transition-transform active:scale-95 shadow-sm inline-flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>ورود به حساب کاربری مهندسان</span>
            </button>
          )}
        </div>
      ) : selectedProject ? (
        /* ======================================================== */
        /* SINGLE PROJECT DETAILED DOSSIER VIEW (پرونده دیجیتال پروژه) */
        /* ======================================================== */
        <div className="space-y-3.5 animate-fadeIn">
          {/* UNIFIED COMPACT PROJECT CARD + WBS PHYSICAL PROGRESS IN GRAY CONTAINER */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-200/90 border border-slate-300 shadow-2xs space-y-3 text-slate-800">
            {/* Row 1: Back Button, Title, Badges, Actions Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-300/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(null)}
                  className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300/70 transition-colors shadow-2xs"
                  title="بازگشت به پروژه‌ها"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>

                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {selectedProject.name}
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border ${
                    selectedProject.projectStatus === 'active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedProject.projectStatus === 'paused'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {selectedProject.projectStatus === 'active'
                    ? 'اجرا: فعال'
                    : selectedProject.projectStatus === 'paused'
                    ? 'اجرا: متوقف'
                    : 'اجرا: تکمیل'}
                </span>

                {(() => {
                  const cEval = evaluateContractStatus(
                    selectedProject.contractEndDate,
                    selectedProject.isArchived
                  );
                  return (
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border ${cEval.badgeClass}`}>
                      قرارداد: {cEval.label}
                    </span>
                  );
                })()}

                {!selectedProject.isArchived ? (
                  <div className="flex items-center gap-1.5 mr-1">
                    <button
                      onClick={() => setIsComprehensiveReportOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
                      title="مشاهده شناسنامه و گزارش کلی و جامع سوابق پروژه"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>گزارش کلی پروژه</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(selectedProject)}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-slate-300/60"
                      title="ویرایش پروژه"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setTerminateModalProject(selectedProject);
                        setTerminationNoteInput('');
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px]"
                      title="ثبت خاتمه همکاری"
                    >
                      خاتمه همکاری
                    </button>
                    <button
                      onClick={() => setDeleteConfirmProject(selectedProject)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsComprehensiveReportOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>گزارش کلی پروژه</span>
                    </button>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      بایگانی‌شده
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Combined Specs + Integrated Physical Progress inside Unified Gray Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
              {/* Specs Column 1 */}
              <div className="space-y-1 text-slate-700 bg-white/75 p-2.5 rounded-xl border border-slate-300/70 shadow-2xs">
                <div className="flex items-center gap-1 font-bold text-slate-900 truncate">
                  <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{selectedProject.address || 'آدرس ثبت نشده'}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  کارفرما: <strong className="text-slate-900">{selectedProject.employerName || 'نامشخص'}</strong>
                  {selectedProject.employerPhone && ` (${selectedProject.employerPhone})`}
                </div>
              </div>

              {/* Engineering details Column 2 */}
              <div className="space-y-1 text-[11px] text-slate-700 bg-white/75 p-2.5 rounded-xl border border-slate-300/70 shadow-2xs">
                <div>
                  ناظر: <strong className="text-slate-900">{selectedProject.supervisorName || 'نامشخص'}</strong> | سازه: <strong className="text-slate-900">{selectedProject.structureType}</strong>
                </div>
                <div>
                  تعداد طبقات: <strong className="text-indigo-800 font-bold">{toPersianDigits(selectedProject.floorsCount)} طبقه</strong> | پروانه: <strong className="font-mono text-slate-900">{selectedProject.licenseNumber || '-'}</strong>
                </div>
              </div>

              {/* Progress Column 3 inside Gray Card */}
              {(() => {
                const progressPct = calculateProjectWbsProgress(projectStages, selectedProject.inspections || []);
                return (
                  <div className="bg-white/85 p-2.5 rounded-xl border border-slate-300/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 text-[11px]">پیشرفت فیزیکی پروژه (WBS):</span>
                      <span className="font-mono text-emerald-700 text-sm font-extrabold">
                        {toPersianDigits(progressPct)}٪
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/90 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-l from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Compact Action Button inside Gray Card: Separated from progress gauge, minimal footprint */}
            {!selectedProject.isArchived && (
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsVisitReportModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ثبت گزارش بازدید</span>
                </button>
              </div>
            )}

            {selectedProject.isArchived && (
              <div className="p-2.5 rounded-xl bg-slate-900 text-white text-[11px] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    این پروژه در تاریخ <strong>{toPersianDigits(selectedProject.terminatedAt || '')}</strong> خاتمه‌یافته و بایگانی شده است (فقط خواندنی).
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Completion Banner when all stages are completed */}
          {allStagesCompleted && (
            <div className="p-4 rounded-2xl bg-gradient-to-l from-emerald-50 via-white to-emerald-50 border border-emerald-300 shadow-2xs space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      تمامی مراحل اجرای کار با موفقیت به اتمام رسید
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      تمامی {toPersianDigits(projectStages.length)} مرحله کارگاه تکمیل شده‌اند. کادر مراحل کارگاه جهت خلوتی بسته شد و آماده دریافت گزارش کلی پروژه است.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsStagesManuallyOpen(!isStagesManuallyOpen)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isStagesManuallyOpen ? 'بستن کادر مراحل' : 'مشاهده و ویرایش مراحل کارگاه'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsComprehensiveReportOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                  >
                    <Award className="w-4 h-4" />
                    <span>گزارش کلی پروژه</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Project Stages Timeline Selector & Inspection Controls: Closed upon completion, can be toggled to edit */}
          {(!allStagesCompleted || isStagesManuallyOpen) && (
            <>
              <ProjectStagesTimeline
                stages={projectStages}
                currentStageId={selectedProject.currentStageId || 1}
                selectedStageId={selectedStageId}
                onSelectStage={(id) => setSelectedStageId(id)}
                isArchived={selectedProject.isArchived}
              />

              <InspectionControlsCard
                stageId={selectedStageId}
                stageName={currentStageName}
                structureType={selectedProject.structureType}
                isCurrentActiveStage={selectedStageId === (selectedProject.currentStageId || 1)}
                isStageCompleted={projectStages.find((s) => s.id === selectedStageId)?.status === 'completed'}
                isStageLocked={selectedStageId > (selectedProject.currentStageId || 1)}
                inspections={selectedProject.inspections || []}
                onAddInspection={handleAddInspection}
                onBulkAddInspections={handleBulkAddInspections}
                onCompleteStage={handleCompleteStage}
                isArchived={selectedProject.isArchived}
              />
            </>
          )}

          {/* Section B: Discrepancy Lifecycle & Resolution Card */}
          <DiscrepancyLifecycleCard
            discrepancies={selectedProject.discrepancies || []}
            onUpdateDiscrepancyStatus={handleUpdateDiscrepancyStatus}
            isArchived={selectedProject.isArchived}
          />

          {/* Section C: Official Inspection Reports List */}
          <InspectionReportsList
            reports={selectedProject.reports || []}
            onOpenNewReportModal={() => setIsNewReportModalOpen(true)}
            isArchived={selectedProject.isArchived}
          />

          {/* New Report Generation Modal */}
          {isNewReportModalOpen && (
            <InspectionReportModal
              project={selectedProject}
              currentUsername={currentUser.fullName || currentUser.name || currentUser.username}
              discrepancies={selectedProject.discrepancies || []}
              stageId={selectedStageId}
              stageName={currentStageName}
              onSaveReport={handleSaveReport}
              onClose={() => setIsNewReportModalOpen(false)}
            />
          )}

          {/* Site Visit Report Modal (ثبت گزارش بازدید) */}
          {isVisitReportModalOpen && currentUser && (
            <VisitReportModal
              project={selectedProject}
              stages={projectStages}
              currentStageId={selectedStageId}
              currentUsername={currentUser.fullName || currentUser.name || currentUser.username}
              discrepancies={selectedProject.discrepancies || []}
              onSaveReport={handleSaveReport}
              onClose={() => setIsVisitReportModalOpen(false)}
            />
          )}

          {/* Comprehensive Project Final Report Modal (گزارش کلی پروژه) */}
          {isComprehensiveReportOpen && (
            <ComprehensiveProjectReportModal
              project={selectedProject}
              stages={projectStages}
              onClose={() => setIsComprehensiveReportOpen(false)}
            />
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* PROJECT LIST VIEW (لیست پروژه‌های مهندس)                   */
        /* ======================================================== */
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProjectSubTab('current')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  projectSubTab === 'current'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>پروژه‌های جاری</span>
                <span className="font-mono text-[11px] bg-white/20 px-1.5 py-0.2 rounded-full">
                  {toPersianDigits(currentProjects.length)}
                </span>
              </button>

              <button
                onClick={() => setProjectSubTab('archived')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  projectSubTab === 'archived'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                <span>پروژه‌های بایگانی‌شده</span>
                <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded-full">
                  {toPersianDigits(archivedProjects.length)}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 hidden sm:inline">فیلتر اجرا:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="p-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="paused">متوقف</option>
                <option value="completed">تکمیل‌شده</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="جستجو در نام پروژه، آدرس، شماره قرارداد، پروانه یا نام کارفرما..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs"
            />
          </div>

          {displayedProjects.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-700">
                {projectSubTab === 'current'
                  ? 'هیچ پروژه جاری یافت نشد.'
                  : 'هیچ پروژه‌ای در بخش بایگانی‌شده وجود ندارد.'}
              </h4>
              {projectSubTab === 'current' && (
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تعریف اولین پروژه</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedProjects.map((proj) => {
                const cEval = evaluateContractStatus(proj.contractEndDate, proj.isArchived);
                const stageName =
                  (proj.stages || DEFAULT_PROJECT_STAGES).find((s: any) => s.id === (proj.currentStageId || 1))
                    ?.name || 'مرحله ۱';

                return (
                  <div
                    key={proj.id}
                    className={`p-4 rounded-2xl bg-white border transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between space-y-3 ${
                      proj.isArchived
                        ? 'border-slate-300 bg-slate-50/50'
                        : cEval.status === 'near_expiry'
                        ? 'border-amber-300'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">{proj.name}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cEval.badgeClass}`}
                        >
                          {cEval.label}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{proj.address || 'آدرس ثبت نشده'}</span>
                      </p>

                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-100 text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">مرحله جاری:</span>
                          <span className="font-bold text-indigo-700 truncate block">
                            {stageName}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">پیشرفت فیزیکی:</span>
                          <span className="font-bold text-emerald-700 font-mono">
                            {toPersianDigits(calculateProjectWbsProgress(proj.stages || [], proj.inspections || []))}٪
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">مغایرت‌ها / گزارش‌ها:</span>
                          <span className="font-bold text-slate-800">
                            {toPersianDigits(proj.discrepancies?.length || 0)} / {toPersianDigits(proj.reports?.length || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-[10px] text-slate-400 font-mono">
                        انقضا: {toPersianDigits(proj.contractEndDate || 'نامشخص')}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setSelectedStageId(proj.currentStageId || 1);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>پرونده و بازدید</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE OR EDIT PROJECT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-2xl p-5 shadow-2xl space-y-4 my-8 text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingProject ? 'ویرایش اطلاعات پروژه' : 'تعریف و ثبت پروژه جدید'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">نام پروژه (الزامی):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ساختمان مسکونی سپهر (خیابان کاشانی)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">آدرس دقیق پروژه:</label>
                <input
                  type="text"
                  placeholder="مثال: ارومیه، خیابان دانشکده، کوچه ۱۲، پلاک ۴"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">شماره قرارداد مدیریت پیمان:</label>
                  <input
                    type="text"
                    placeholder="مثال: ۱۴۰۵/پ/۲۳۴"
                    value={formContractNumber}
                    onChange={(e) => setFormContractNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">شماره پروانه ساختمانی:</label>
                  <input
                    type="text"
                    placeholder="مثال: ۱۲-۹۸۷۶۵"
                    value={formLicenseNumber}
                    onChange={(e) => setFormLicenseNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">تاریخ عقد قرارداد (شمسی):</label>
                  <input
                    type="text"
                    placeholder="1405/01/15"
                    value={formContractStartDate}
                    onChange={(e) => setFormContractStartDate(normalizePersianDigits(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">تاریخ پایان قرارداد (شمسی):</label>
                  <input
                    type="text"
                    placeholder="1406/01/15"
                    value={formContractEndDate}
                    onChange={(e) => setFormContractEndDate(normalizePersianDigits(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">نام کارفرما:</label>
                  <input
                    type="text"
                    placeholder="مثال: مهندس باقری"
                    value={formEmployerName}
                    onChange={(e) => setFormEmployerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">شماره تماس کارفرما:</label>
                  <input
                    type="text"
                    placeholder="0914xxxxxxx"
                    value={formEmployerPhone}
                    onChange={(e) => setFormEmployerPhone(normalizePersianDigits(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">مهندس ناظر:</label>
                  <input
                    type="text"
                    placeholder="مثال: دکتر حسینی"
                    value={formSupervisorName}
                    onChange={(e) => setFormSupervisorName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">شماره تماس ناظر:</label>
                  <input
                    type="text"
                    placeholder="0914xxxxxxx"
                    value={formSupervisorPhone}
                    onChange={(e) => setFormSupervisorPhone(normalizePersianDigits(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">مهندس طراح سازه:</label>
                  <input
                    type="text"
                    placeholder="مثال: مهندس راد"
                    value={formStructuralDesignerName}
                    onChange={(e) => setFormStructuralDesignerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">شماره تماس طراح سازه:</label>
                  <input
                    type="text"
                    placeholder="0914xxxxxxx"
                    value={formStructuralDesignerPhone}
                    onChange={(e) => setFormStructuralDesignerPhone(normalizePersianDigits(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">نوع سازه:</label>
                  <select
                    value={formStructureType}
                    onChange={(e) => setFormStructureType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="بتنی">بتنی</option>
                    <option value="فولادی">فولادی</option>
                    <option value="ترکیبی">ترکیبی</option>
                    <option value="بنایی">بنایی</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">تعداد طبقات:</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formFloorsCount}
                    onChange={(e) => setFormFloorsCount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-indigo-600 block leading-tight">
                    مراحل اجرایی متناسب با طبقات ردیف می‌شوند
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">زیربنا (مترمربع):</label>
                  <input
                    type="number"
                    min="0"
                    value={formTotalArea}
                    onChange={(e) => setFormTotalArea(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">وضعیت اجرایی:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'active', label: 'فعال' },
                    { id: 'paused', label: 'متوقف' },
                    { id: 'completed', label: 'تکمیل‌شده' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFormProjectStatus(st.id as any)}
                      className={`p-2 rounded-xl border text-xs font-bold ${
                        formProjectStatus === st.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">توضیحات کارگاه:</label>
                <textarea
                  rows={2}
                  placeholder="نکات خاص فنی یا ضوابط قرارداد..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-amber-400 font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ثبت...' : editingProject ? 'ذخیره تغییرات' : 'ثبت پروژه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TERMINATION CONFIRMATION MODAL */}
      {terminateModalProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تأیید نهایی ثبت «خاتمه همکاری» و بایگانی پرونده
                </h3>
                <span className="text-xs text-rose-600 font-semibold">
                  پروژه: {terminateModalProject.name}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-slate-800 text-xs leading-relaxed space-y-2">
              <p className="font-bold text-amber-950 text-sm">توجه</p>
              <p>
                با ثبت «خاتمه همکاری»، پرونده و سوابق این پروژه بایگانی می‌شوند و پس از آن اطلاعات پروژه و سوابق ثبت‌شده قابل ویرایش یا حذف نخواهند بود.
              </p>
              <p>
                لطفاً قبل از ثبت خاتمه همکاری مطمئن شوید تمام اطلاعات، فعالیت‌ها، کنترل‌ها، گزارش‌ها و سوابق موردنیاز خود را ثبت کرده‌اید.
              </p>
              <p className="font-bold text-slate-900 pt-1">
                آیا از ثبت خاتمه همکاری اطمینان دارید؟
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">توضیحات صورت‌جلسه خاتمه همکاری (اختیاری):</label>
              <textarea
                rows={2}
                placeholder="تحویل موقت کارگاه، تسویه حساب یا شماره صورت‌جلسه..."
                value={terminationNoteInput}
                onChange={(e) => setTerminationNoteInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTerminateModalProject(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmTermination}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'در حال ثبت...' : 'ثبت خاتمه همکاری'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 text-right">
            <h3 className="text-sm font-bold text-slate-900">
              آیا از حذف پروژه «{deleteConfirmProject.name}» اطمینان دارید؟
            </h3>
            <p className="text-xs text-slate-500">
              این عمل غیرقابل بازگشت است و پرونده جاری این پروژه حذف خواهد شد.
            </p>
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setDeleteConfirmProject(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold"
              >
                حذف پروژه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
