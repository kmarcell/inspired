import React, { useState, useEffect } from 'react';
import { YogaStudio, StudioClass, BrandClassTemplate, CompanyCurrency } from '../types';
import { firestoreService } from '../services/firestoreService';
import { colorTokens } from '../theme/colorTokens';
import { CreateClassView } from './CreateClassView';
import { CreateClassFromTemplateModal } from './CreateClassFromTemplateModal';

interface StudioClassManagerViewProps {
  studio: YogaStudio;
  availableStudios?: YogaStudio[];
  companyCurrencies?: CompanyCurrency[];
  onBack: () => void;
  onScheduleUpdated?: () => void;
  isEmbedded?: boolean;
}

export const StudioClassManagerView: React.FC<StudioClassManagerViewProps> = ({
  studio,
  availableStudios = [studio],
  companyCurrencies = [],
  onBack,
  onScheduleUpdated,
  isEmbedded = false,
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
        teacherId: draft.teacherId || (studio.assignedTeachers?.[0]?.id || studio.ownerId || 'studio_staff'),
        teacherName: draft.teacherName || (studio.assignedTeachers?.[0]?.displayName || `${studio.name} Staff`),
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
    <div className={isEmbedded ? `space-y-6 ${colorTokens.surfaces.page}` : `max-w-5xl mx-auto px-4 py-6 ${colorTokens.surfaces.page} space-y-6`}>
      {/* Header Bar */}
      {!isEmbedded ? (
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 ${colorTokens.borders.dividerBottom}`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className={colorTokens.buttons.secondary}
            >
              ← Back
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${colorTokens.text.primary} flex items-center gap-2`}>
                <span>📅 Class Templates & Drafts Manager</span>
              </h1>
              <p className={`text-xs ${colorTokens.text.subtle}`}>
                {studio.name} ({studio.location_prefix}) {studio.parentBrandName ? `• ${studio.parentBrandName}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreatorOpen(true)}
            className={colorTokens.buttons.primaryGradient}
          >
            <span>＋ Create New Class / Template</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
          <div>
            <h2 className={`text-lg font-bold ${colorTokens.text.primary} flex items-center gap-2`}>
              <span>📅 Class Templates &amp; Drafts</span>
            </h2>
            <p className={`text-xs ${colorTokens.text.subtle}`}>
              Manage brand-wide blueprints and saved location drafts for {studio.name}.
            </p>
          </div>

          <button
            onClick={() => setIsCreatorOpen(true)}
            className={colorTokens.buttons.primaryGradient}
          >
            <span>＋ Create New Class / Template</span>
          </button>
        </div>
      )}

      {/* Notifications */}
      {successToast && (
        <div className={`p-4 rounded-xl ${colorTokens.surfaces.emeraldNotice} text-sm flex items-center justify-between animate-in fade-in`}>
          <span>✅ {successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 dark:text-emerald-400 hover:opacity-80">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className={`p-4 rounded-xl ${colorTokens.surfaces.roseNotice} text-sm flex items-center justify-between`}>
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 dark:text-red-400 hover:opacity-80">✕</button>
        </div>
      )}

      {/* Tab Selector */}
      <div className={`flex items-center space-x-2 ${colorTokens.borders.dividerBottom} pb-2`}>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'templates'
              ? colorTokens.tabs.activeAmber
              : colorTokens.tabs.inactive
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
              ? colorTokens.tabs.activeSlate
              : colorTokens.tabs.inactive
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
        <div className={`p-12 text-center ${colorTokens.text.subtle}`}>
          <div className="animate-spin inline-block w-8 h-8 border-2 border-current border-t-transparent text-emerald-600 dark:text-emerald-400 rounded-full mb-3" />
          <p className="text-xs">Loading class manager specs...</p>
        </div>
      ) : activeTab === 'templates' ? (
        /* Tab 1: Brand Class Templates */
        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${colorTokens.surfaces.amberNotice} text-xs flex items-center justify-between`}>
            <span>
              ℹ️ Templates are shared blueprints available across all studio branches in the <strong>{studio.parentBrandName || 'brand network'}</strong>.
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${colorTokens.badges.amber}`}>Teacher-Agnostic</span>
          </div>

          {templates.length === 0 ? (
            <div className={`p-12 text-center ${colorTokens.surfaces.card} space-y-3`}>
              <span className="text-4xl">📋</span>
              <h3 className={`text-base font-semibold ${colorTokens.text.primary}`}>No Class Templates Saved</h3>
              <p className={`text-xs ${colorTokens.text.muted} max-w-md mx-auto`}>
                Create reusable class templates (e.g. <i>Hot Vinyasa 60m</i>, <i>Ashtanga Primary 90m</i>) to rapidly schedule classes across any branch.
              </p>
              <button
                onClick={() => setIsCreatorOpen(true)}
                className={colorTokens.buttons.amberAction}
              >
                ＋ Create First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`${colorTokens.surfaces.cardInteractive} p-5 space-y-3 flex flex-col justify-between`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full ${colorTokens.badges.amber} text-[10px] font-bold uppercase tracking-wider`}>
                          {tpl.styleName || 'Yoga Class'}
                        </span>
                        <h3 className={`text-base font-bold ${colorTokens.text.primary} mt-1`}>{tpl.className}</h3>
                      </div>
                      <span className={`text-xs font-semibold ${colorTokens.text.subtle}`}>
                        {tpl.durationMinutes} min
                      </span>
                    </div>

                    <p className={`text-xs ${colorTokens.text.secondary} line-clamp-2`}>
                      {tpl.classTypeDescription}
                    </p>

                    <div className={`flex flex-wrap items-center gap-2 pt-1 text-[11px] ${colorTokens.text.muted}`}>
                      <span className={`px-2 py-0.5 rounded ${colorTokens.surfaces.inset}`}>
                        👥 Capacity: {tpl.capacity} Yogis
                      </span>
                      <span className={`px-2 py-0.5 rounded ${colorTokens.surfaces.inset}`}>
                        {tpl.roomClimate === 'hot_studio' ? `🔥 ${tpl.temperatureCelsius || 35}°C Hot` : tpl.roomClimate}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${colorTokens.surfaces.inset}`}>
                        🧘 {tpl.skillLevel || 'All Levels'}
                      </span>
                      {tpl.currencyAcceptancePolicyMode === 'customSelected' && (
                        <span className={`px-2 py-0.5 rounded ${colorTokens.badges.purple} font-semibold`}>
                          💳 Restricted Pricing
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`pt-3 ${colorTokens.borders.dividerTop} flex items-center justify-between gap-2`}>
                    <button
                      onClick={() => setSchedulingTemplate(tpl)}
                      className={colorTokens.buttons.primaryGradient}
                    >
                      <span>📅 Use Template to Schedule ➔</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingTemplate(tpl)}
                        className={colorTokens.buttons.secondary}
                        title="Edit Template Blueprint"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className={colorTokens.buttons.danger}
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
            <div className={`p-12 text-center ${colorTokens.surfaces.card} space-y-3`}>
              <span className="text-4xl">📝</span>
              <h3 className={`text-base font-semibold ${colorTokens.text.primary}`}>No Saved Drafts</h3>
              <p className={`text-xs ${colorTokens.text.muted} max-w-md mx-auto`}>
                Classes saved as drafts remain visible strictly to studio admins in this management portal until published live.
              </p>
              <button
                onClick={() => setIsCreatorOpen(true)}
                className={colorTokens.buttons.secondaryText}
              >
                ＋ Create Class Draft
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drafts.map((dft) => (
                <div
                  key={dft.id}
                  className={`${colorTokens.surfaces.card} p-5 space-y-3 flex flex-col justify-between`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full ${colorTokens.badges.neutral} text-[10px] font-bold uppercase tracking-wider`}>
                          📝 Draft
                        </span>
                        <h3 className={`text-base font-bold ${colorTokens.text.primary} mt-1`}>{dft.className}</h3>
                      </div>
                      <span className={`text-xs font-semibold ${colorTokens.text.subtle}`}>
                        {dft.startTime || '07:30 AM'} ({dft.durationMinutes || 60}m)
                      </span>
                    </div>

                    <p className={`text-xs ${colorTokens.text.secondary}`}>
                      🧘 Teacher: <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{dft.teacherName || 'TBD'}</span>
                    </p>

                    <div className={`flex flex-wrap items-center gap-2 pt-1 text-[11px] ${colorTokens.text.muted}`}>
                      <span className={`px-2 py-0.5 rounded ${colorTokens.surfaces.inset}`}>
                        📅 {dft.dateString || 'Today'}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${colorTokens.surfaces.inset}`}>
                        🔄 {dft.recurrence?.frequency ? `Recurrence: ${dft.recurrence.frequency}` : 'Single Session'}
                      </span>
                    </div>
                  </div>

                  <div className={`pt-3 ${colorTokens.borders.dividerTop} flex items-center justify-between gap-2`}>
                    <button
                      onClick={() => handlePublishDraftDirectly(dft)}
                      className={`px-4 py-2 rounded-xl ${colorTokens.badges.emerald} text-xs font-bold transition-all flex items-center gap-1.5 hover:opacity-90`}
                    >
                      <span>🚀 Publish Live</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingDraft(dft)}
                        className={colorTokens.buttons.secondaryText}
                      >
                        ✏️ Resume Editing
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(dft.id)}
                        className={colorTokens.buttons.danger}
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
