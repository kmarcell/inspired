import React, { useState, useEffect } from 'react';
import { YogaStudio, StudioClass, BrandClassTemplate, CompanyCurrency } from '../types';
import { firestoreService } from '../services/firestoreService';
import { CreateClassView } from './CreateClassView';
import { CreateClassFromTemplateModal } from './CreateClassFromTemplateModal';

interface StudioClassManagerViewProps {
  studio: YogaStudio;
  availableStudios?: YogaStudio[];
  companyCurrencies?: CompanyCurrency[];
  onBack: () => void;
  onScheduleUpdated?: () => void;
}

export const StudioClassManagerView: React.FC<StudioClassManagerViewProps> = ({
  studio,
  availableStudios = [studio],
  companyCurrencies = [],
  onBack,
  onScheduleUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'drafts'>('templates');

  // Data state
  const [templates, setTemplates] = useState<BrandClassTemplate[]>([]);
  const [drafts, setDrafts] = useState<StudioClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Active Modes
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<StudioClass | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<BrandClassTemplate | null>(null);
  const [schedulingTemplate, setSchedulingTemplate] = useState<BrandClassTemplate | null>(null);

  const loadManagerData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedTemplates, fetchedDrafts] = await Promise.all([
        firestoreService.fetchBrandClassTemplates(studio.companyId, studio.id),
        firestoreService.fetchStudioDrafts(studio.id),
      ]);
      setTemplates(fetchedTemplates);
      setDrafts(fetchedDrafts);
    } catch (err: any) {
      console.error('Failed to load class manager data:', err);
      setErrorMsg('Failed to load class templates and drafts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, [studio.id, studio.companyId]);

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this class template blueprint?')) return;
    try {
      await firestoreService.deleteBrandClassTemplate(templateId);
      setSuccessToast('Class template blueprint deleted.');
      loadManagerData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete template.');
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!window.confirm('Are you sure you want to delete this class draft?')) return;
    try {
      await firestoreService.deleteStudioClassDraft(studio.id, draftId);
      setSuccessToast('Class draft deleted.');
      loadManagerData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete draft.');
    }
  };

  const handlePublishDraftDirectly = async (draft: StudioClass) => {
    try {
      await firestoreService.publishStudioClass({
        studioId: studio.id,
        companyId: studio.companyId,
        className: draft.className,
        styleName: draft.styleName || draft.className,
        classTypeDescription: draft.classTypeDescription,
        description: draft.description || '',
        teacherId: draft.teacherId || (studio.assignedTeachers?.[0]?.id || 'teacher_elena'),
        teacherName: draft.teacherName || (studio.assignedTeachers?.[0]?.displayName || 'Elena Rostova'),
        dateString: draft.dateString || new Date().toISOString().split('T')[0],
        startTime: draft.startTime || '07:30 AM',
        endTime: draft.endTime || '08:30 AM',
        durationMinutes: draft.durationMinutes || 60,
        capacity: draft.capacity || 20,
        roomClimate: draft.roomClimate,
        temperatureCelsius: draft.temperatureCelsius,
        skillLevel: draft.skillLevel,
        equipmentNeeded: draft.equipmentNeeded,
        currencyAcceptancePolicyMode: draft.currencyAcceptancePolicyMode || 'acceptAll',
        acceptedCurrencyIds: draft.acceptedCurrencyIds || [],
        recurrence: draft.recurrence,
      });

      await firestoreService.deleteStudioClassDraft(studio.id, draft.id);
      setSuccessToast(`Published "${draft.className}" live to schedule! 🚀`);
      loadManagerData();
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish draft.');
    }
  };

  // If Creator View is open
  if (isCreatorOpen || editingDraft || editingTemplate) {
    return (
      <CreateClassView
        studio={studio}
        companyCurrencies={companyCurrencies}
        initialDraft={editingDraft}
        initialTemplate={editingTemplate}
        onBack={() => {
          setIsCreatorOpen(false);
          setEditingDraft(null);
          setEditingTemplate(null);
        }}
        onSaveSuccess={(action) => {
          setIsCreatorOpen(false);
          setEditingDraft(null);
          setEditingTemplate(null);
          setSuccessToast(
            action === 'draft'
              ? 'Draft saved successfully!'
              : action === 'template'
              ? 'Template blueprint saved to brand catalog!'
              : 'Class published live to studio schedule! 🚀'
          );
          loadManagerData();
          if (onScheduleUpdated) onScheduleUpdated();
        }}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 text-slate-900 dark:text-slate-100 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📅 Class Templates & Drafts Manager</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {studio.name} ({studio.location_prefix}) {studio.parentBrandName ? `• ${studio.parentBrandName}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreatorOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <span>＋ Create New Class / Template</span>
        </button>
      </div>

      {/* Notifications */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 dark:bg-emerald-950/70 dark:border-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between animate-in fade-in">
          <span>✅ {successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 dark:text-emerald-400 hover:opacity-80">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200 text-sm flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 dark:text-red-400 hover:opacity-80">✕</button>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
          }`}
        >
          <span>📋 Brand Class Templates</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-slate-800 dark:text-slate-300 text-[10px]">
            {templates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'drafts'
              ? 'bg-slate-200 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
          }`}
        >
          <span>📝 Saved Studio Drafts</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-300 text-[10px]">
            {drafts.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-current border-t-transparent text-emerald-600 dark:text-emerald-400 rounded-full mb-3" />
          <p className="text-xs">Loading class manager specs...</p>
        </div>
      ) : activeTab === 'templates' ? (
        /* Tab 1: Brand Class Templates */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 text-xs flex items-center justify-between">
            <span>
              ℹ️ Templates are shared blueprints available across all studio branches in the <strong>{studio.parentBrandName || 'brand network'}</strong>.
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-transparent">Teacher-Agnostic</span>
          </div>

          {templates.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="text-4xl">📋</span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Class Templates Saved</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Create reusable class templates (e.g. <i>Hot Vinyasa 60m</i>, <i>Ashtanga Primary 90m</i>) to rapidly schedule classes across any branch.
              </p>
              <button
                onClick={() => setIsCreatorOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 dark:hover:bg-amber-500/30 text-xs font-bold transition-colors"
              >
                ＋ Create First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-transparent text-[10px] font-bold uppercase tracking-wider">
                          {tpl.styleName || 'Yoga Class'}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{tpl.className}</h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {tpl.durationMinutes} min
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {tpl.classTypeDescription}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        👥 Capacity: {tpl.capacity} Yogis
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        {tpl.roomClimate === 'hot_studio' ? `🔥 ${tpl.temperatureCelsius || 35}°C Hot` : tpl.roomClimate}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        🧘 {tpl.skillLevel || 'All Levels'}
                      </span>
                      {tpl.currencyAcceptancePolicyMode === 'customSelected' && (
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 font-semibold">
                          💳 Restricted Pricing
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSchedulingTemplate(tpl)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 text-xs font-bold shadow-md transition-all hover:scale-[1.02] flex items-center gap-1.5"
                    >
                      <span>📅 Use Template to Schedule ➔</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingTemplate(tpl)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-transparent"
                        title="Edit Template Blueprint"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 dark:bg-slate-800 dark:hover:bg-red-950 dark:text-slate-400 dark:hover:text-red-300 text-xs font-semibold border border-slate-200 dark:border-transparent"
                        title="Delete Template Blueprint"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Saved Studio Drafts */
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="text-4xl">📝</span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Saved Drafts</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Classes saved as drafts remain visible strictly to studio admins in this management portal until published live.
              </p>
              <button
                onClick={() => setIsCreatorOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-bold transition-colors"
              >
                ＋ Create Class Draft
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drafts.map((dft) => (
                <div
                  key={dft.id}
                  className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                          📝 Draft
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{dft.className}</h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {dft.startTime || '07:30 AM'} ({dft.durationMinutes || 60}m)
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      🧘 Teacher: <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{dft.teacherName || 'TBD'}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        📅 {dft.dateString || 'Today'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        🔄 {dft.recurrence?.frequency ? `Recurrence: ${dft.recurrence.frequency}` : 'Single Session'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handlePublishDraftDirectly(dft)}
                      className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:hover:bg-emerald-500/30 dark:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>🚀 Publish Live</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingDraft(dft)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-transparent text-xs font-semibold"
                      >
                        ✏️ Resume Editing
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(dft.id)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 dark:bg-slate-800 dark:hover:bg-red-950 dark:text-slate-400 dark:hover:text-red-300 text-xs font-semibold border border-slate-200 dark:border-transparent"
                        title="Delete Draft"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule from Template Modal */}
      {schedulingTemplate && (
        <CreateClassFromTemplateModal
          template={schedulingTemplate}
          activeStudio={studio}
          availableStudios={availableStudios}
          onClose={() => setSchedulingTemplate(null)}
          onSuccess={() => {
            setSchedulingTemplate(null);
            setSuccessToast(`Live class schedule created from "${schedulingTemplate.className}"! 🚀`);
            loadManagerData();
            if (onScheduleUpdated) onScheduleUpdated();
          }}
        />
      )}

    </div>
  );
};
