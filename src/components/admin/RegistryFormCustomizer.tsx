import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  Plus,
  Trash2,
  Copy,
  Edit2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  Send,
  RotateCcw,
  X,
  GripVertical,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Sparkles,
  Layers,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Tag,
  ToggleLeft,
  ToggleRight,
  ListFilter,
  CheckSquare,
} from 'lucide-react';
import {
  RegistryFormField,
  RegistryFormSection,
  RegistryFormSchema,
  RegistryFieldType,
  Barangay,
} from '../../types';
import { storageService } from '../../services/storageService';
import { INITIAL_REGISTRY_FORM_SCHEMA } from '../../data/initialFormSchema';

interface RegistryFormCustomizerProps {
  barangays?: Barangay[];
  onRefresh?: () => void;
  onNavigateTab?: (tab: string) => void;
}

const FIELD_TYPE_LABELS: Record<RegistryFieldType, { name: string; icon: string; category: string }> = {
  text: { name: 'Text Field', icon: 'Aa', category: 'Standard Input' },
  number: { name: 'Number Field', icon: '#', category: 'Standard Input' },
  email: { name: 'Email Address', icon: '@', category: 'Standard Input' },
  phone: { name: 'Phone / Mobile', icon: '📞', category: 'Standard Input' },
  date: { name: 'Date Picker', icon: '📅', category: 'Date & Time' },
  time: { name: 'Time Picker', icon: '🕒', category: 'Date & Time' },
  dropdown: { name: 'Dropdown Menu', icon: '▼', category: 'Choice & Selection' },
  radio: { name: 'Radio Buttons', icon: '◉', category: 'Choice & Selection' },
  checkbox: { name: 'Checkbox', icon: '☑', category: 'Choice & Selection' },
  multiselect: { name: 'Multi-Select', icon: '☰', category: 'Choice & Selection' },
  textarea: { name: 'Text Area', icon: '¶', category: 'Standard Input' },
  file: { name: 'File Upload (PDF/Doc)', icon: '📎', category: 'Media & Attachments' },
  image: { name: 'Image Upload (Photo)', icon: '🖼️', category: 'Media & Attachments' },
  location: { name: 'Location / Address', icon: '📍', category: 'Geo & Location' },
  gps: { name: 'GPS Coordinates', icon: '🌐', category: 'Geo & Location' },
  barangay_select: { name: 'Barangay Selector', icon: '🏛️', category: 'Specialized Selector' },
  breed_select: { name: 'Breed Selector', icon: '🐖', category: 'Specialized Selector' },
  yes_no: { name: 'Yes / No Toggle', icon: '⇄', category: 'Choice & Selection' },
};

export const RegistryFormCustomizer: React.FC<RegistryFormCustomizerProps> = ({
  barangays = [],
  onRefresh,
  onNavigateTab,
}) => {
  // Schema State - initialize from the active shared schema configuration
  const [schema, setSchema] = useState<RegistryFormSchema>(() => storageService.getRegistryFormSchema());
  const [activeSectionId, setActiveSectionId] = useState<string>(() => schema.sections[0]?.id || 'sec_farm');

  // Preview Mode
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTab, setPreviewTab] = useState<string>(activeSectionId);

  // Field Modal State
  const [editingField, setEditingField] = useState<{
    sectionId: string;
    field: RegistryFormField;
    isNew: boolean;
  } | null>(null);

  // Field Edit Form Working State
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<RegistryFieldType>('text');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldHelpText, setFieldHelpText] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldVisible, setFieldVisible] = useState(true);
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');

  // Section Modal State
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');

  // Confirmation Modal & Feedback State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);

  useEffect(() => {
    setPreviewTab(activeSectionId);
  }, [activeSectionId]);

  // Keep customizer in sync if external schema changes occur
  useEffect(() => {
    const handleSchemaChange = (e: Event) => {
      const customEvent = e as CustomEvent<RegistryFormSchema>;
      if (customEvent.detail) {
        setSchema(customEvent.detail);
      }
    };
    window.addEventListener('da_registry_schema_change', handleSchemaChange);
    return () => window.removeEventListener('da_registry_schema_change', handleSchemaChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Synchronize any updates immediately with the actual Swine Registry Form configuration
  const updateSchemaAndSync = (newSchema: RegistryFormSchema, message?: string) => {
    setSchema(newSchema);
    storageService.saveRegistryFormSchema(newSchema);
    storageService.saveRegistryFormDraft(newSchema);
    if (message) {
      showToast(message);
    }
    if (onRefresh) onRefresh();
  };

  const activeSection = schema.sections.find(s => s.id === activeSectionId) || schema.sections[0];

  // Open Field Modal for Add
  const handleOpenAddField = (sectionId: string) => {
    const newField: RegistryFormField = {
      id: 'fld_' + Date.now().toString(36),
      label: 'New Custom Field',
      type: 'text',
      placeholder: 'Enter details...',
      helpText: '',
      required: false,
      visible: true,
      options: ['Option 1', 'Option 2'],
    };
    setEditingField({ sectionId, field: newField, isNew: true });
    setFieldLabel(newField.label);
    setFieldType(newField.type);
    setFieldPlaceholder(newField.placeholder || '');
    setFieldHelpText(newField.helpText || '');
    setFieldRequired(newField.required);
    setFieldVisible(newField.visible);
    setFieldOptions(newField.options || []);
    setNewOptionInput('');
  };

  // Open Field Modal for Edit
  const handleOpenEditField = (sectionId: string, field: RegistryFormField) => {
    setEditingField({ sectionId, field: { ...field }, isNew: false });
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldPlaceholder(field.placeholder || '');
    setFieldHelpText(field.helpText || '');
    setFieldRequired(field.required);
    setFieldVisible(field.visible);
    setFieldOptions(field.options ? [...field.options] : ['Option 1', 'Option 2']);
    setNewOptionInput('');
  };

  // Save Field Modal Changes
  const handleSaveField = () => {
    if (!editingField) return;
    if (!fieldLabel.trim()) {
      alert('Please provide a field label');
      return;
    }

    const needsOptions = ['dropdown', 'radio', 'checkbox', 'multiselect'].includes(fieldType);
    const updatedField: RegistryFormField = {
      ...editingField.field,
      label: fieldLabel.trim(),
      type: fieldType,
      placeholder: fieldPlaceholder.trim() || undefined,
      helpText: fieldHelpText.trim() || undefined,
      required: fieldRequired,
      visible: fieldVisible,
      options: needsOptions ? (fieldOptions.length > 0 ? fieldOptions : ['Option A', 'Option B']) : undefined,
    };

    const newSections = schema.sections.map(sec => {
      if (sec.id !== editingField.sectionId) return sec;
      if (editingField.isNew) {
        return { ...sec, fields: [...sec.fields, updatedField] };
      } else {
        return {
          ...sec,
          fields: sec.fields.map(f => (f.id === updatedField.id ? updatedField : f)),
        };
      }
    });

    const updatedSchema: RegistryFormSchema = {
      ...schema,
      sections: newSections,
      updatedAt: new Date().toISOString(),
    };

    updateSchemaAndSync(
      updatedSchema,
      `✓ Field "${updatedField.label}" saved and synced with Swine Registry Form`
    );
    setEditingField(null);
  };

  // Delete Field
  const handleDeleteField = (sectionId: string, fieldId: string, fieldLabel: string) => {
    if (!window.confirm(`Are you sure you want to remove the field "${fieldLabel}"?`)) return;
    const updatedSchema: RegistryFormSchema = {
      ...schema,
      sections: schema.sections.map(sec =>
        sec.id === sectionId ? { ...sec, fields: sec.fields.filter(f => f.id !== fieldId) } : sec
      ),
      updatedAt: new Date().toISOString(),
    };
    updateSchemaAndSync(updatedSchema, `Removed field "${fieldLabel}"`);
  };

  // Duplicate Field
  const handleDuplicateField = (sectionId: string, field: RegistryFormField) => {
    const duplicated: RegistryFormField = {
      ...field,
      id: 'fld_' + Date.now().toString(36),
      label: `${field.label} (Copy)`,
      options: field.options ? [...field.options] : undefined,
    };

    const newSections = schema.sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      const index = sec.fields.findIndex(f => f.id === field.id);
      const newFields = [...sec.fields];
      newFields.splice(index + 1, 0, duplicated);
      return { ...sec, fields: newFields };
    });

    const updatedSchema: RegistryFormSchema = {
      ...schema,
      sections: newSections,
      updatedAt: new Date().toISOString(),
    };
    updateSchemaAndSync(updatedSchema, `Duplicated "${field.label}"`);
  };

  // Toggle Visibility
  const handleToggleVisible = (sectionId: string, fieldId: string) => {
    const updatedSchema: RegistryFormSchema = {
      ...schema,
      sections: schema.sections.map(sec =>
        sec.id === sectionId
          ? {
              ...sec,
              fields: sec.fields.map(f => (f.id === fieldId ? { ...f, visible: !f.visible } : f)),
            }
          : sec
      ),
      updatedAt: new Date().toISOString(),
    };
    updateSchemaAndSync(updatedSchema, 'Field visibility updated and synced');
  };

  // Toggle Required
  const handleToggleRequired = (sectionId: string, fieldId: string) => {
    const updatedSchema: RegistryFormSchema = {
      ...schema,
      sections: schema.sections.map(sec =>
        sec.id === sectionId
          ? {
              ...sec,
              fields: sec.fields.map(f => (f.id === fieldId ? { ...f, required: !f.required } : f)),
            }
          : sec
      ),
      updatedAt: new Date().toISOString(),
    };
    updateSchemaAndSync(updatedSchema, 'Field requirement updated and synced');
  };

  // Reorder Fields (Move Up / Down)
  const handleMoveField = (sectionId: string, index: number, direction: 'up' | 'down') => {
    const newSections = schema.sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      const newFields = [...sec.fields];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newFields.length) return sec;
      const [moved] = newFields.splice(index, 1);
      newFields.splice(targetIndex, 0, moved);
      return { ...sec, fields: newFields };
    });

    const updatedSchema: RegistryFormSchema = {
      ...schema,
      sections: newSections,
      updatedAt: new Date().toISOString(),
    };
    updateSchemaAndSync(updatedSchema);
  };

  // Drag and Drop reordering handlers
  const handleDragStart = (index: number) => {
    setDraggedFieldIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedFieldIndex === null || draggedFieldIndex === index) return;
    const newSections = schema.sections.map(sec => {
      if (sec.id !== activeSectionId) return sec;
      const newFields = [...sec.fields];
      const [dragged] = newFields.splice(draggedFieldIndex, 1);
      newFields.splice(index, 0, dragged);
      return { ...sec, fields: newFields };
    });

    const updatedSchema: RegistryFormSchema = {
      ...schema,
      sections: newSections,
      updatedAt: new Date().toISOString(),
    };
    updateSchemaAndSync(updatedSchema);
    setDraggedFieldIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedFieldIndex(null);
  };

  // Add Option to Dropdown / Radio / Checkbox
  const handleAddOption = () => {
    if (!newOptionInput.trim()) return;
    setFieldOptions(prev => [...prev, newOptionInput.trim()]);
    setNewOptionInput('');
  };

  const handleRemoveOption = (index: number) => {
    setFieldOptions(prev => prev.filter((_, i) => i !== index));
  };

  // Add Section
  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    const newSection: RegistryFormSection = {
      id: 'sec_' + Date.now().toString(36),
      title: newSectionTitle.trim(),
      description: newSectionDescription.trim() || undefined,
      isCustom: true,
      fields: [],
    };
    const updatedSchema: RegistryFormSchema = {
      ...schema,
      sections: [...schema.sections, newSection],
      updatedAt: new Date().toISOString(),
    };
    setActiveSectionId(newSection.id);
    setIsAddingSection(false);
    setNewSectionTitle('');
    setNewSectionDescription('');
    updateSchemaAndSync(
      updatedSchema,
      `✓ Section "${newSection.title}" created and synced with Registry Form`
    );
  };

  // Delete Section
  const handleDeleteSection = (sectionId: string, title: string) => {
    if (schema.sections.length <= 1) {
      alert('You must have at least one section in the registry form.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete section "${title}" and all its fields?`)) return;
    const filtered = schema.sections.filter(s => s.id !== sectionId);
    if (activeSectionId === sectionId) {
      setActiveSectionId(filtered[0]?.id || '');
    }
    const updatedSchema: RegistryFormSchema = {
      ...schema,
      sections: filtered,
      updatedAt: new Date().toISOString(),
    };
    updateSchemaAndSync(updatedSchema, `Section "${title}" removed`);
  };

  // Move Section Up/Down
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...schema.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);
    const updatedSchema: RegistryFormSchema = {
      ...schema,
      sections: newSections,
      updatedAt: new Date().toISOString(),
    };
    updateSchemaAndSync(updatedSchema);
  };

  // Save Draft
  const handleSaveDraft = () => {
    storageService.saveRegistryFormDraft(schema);
    storageService.saveRegistryFormSchema(schema);
    showToast('✓ Form customization saved and synced with Swine Registry Form');
    if (onRefresh) onRefresh();
  };

  // Reset to Default Form
  const handleResetDefault = () => {
    if (window.confirm('Reset all registration form fields to official DA default template?')) {
      const reset = storageService.resetRegistryFormSchema();
      setSchema(reset);
      setActiveSectionId(reset.sections[0]?.id || 'sec_farm');
      showToast('Form reset to official DA Hinunangan default schema');
      if (onRefresh) onRefresh();
    }
  };

  // Confirm and Publish
  const handleConfirmPublish = () => {
    storageService.saveRegistryFormSchema(schema);
    storageService.saveRegistryFormDraft(schema);
    setIsPublishModalOpen(false);
    showToast('✓ Registry form customization published and synced successfully.');
    if (onRefresh) onRefresh();
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-emerald-50 border border-emerald-500/50 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
            <FileEdit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-stone-900">Registry Form Customization</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Admin-Only Builder
              </span>
            </div>
            <p className="text-sm text-stone-500 mt-1">
              Configure the fields displayed in the Swine Farm and Swine Registry registration forms.
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFullPreviewOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Form</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Form Changes</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation for Sections */}
      <div className="bg-white rounded-2xl p-2 border border-stone-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto select-none">
        <div className="flex items-center gap-1.5 overflow-x-auto min-w-0">
          {schema.sections.map((sec, idx) => {
            const isActive = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSectionId(sec.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>{sec.title}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {sec.fields.length}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsAddingSection(true)}
          className="px-3.5 py-2 rounded-xl border border-dashed border-emerald-600/60 text-emerald-700 hover:bg-emerald-50 font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Section</span>
        </button>
      </div>

      {/* Two-Column Layout: Form Field Builder on Left, Live Form Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Field Management (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeSection && (
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
              {/* Section Header Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900">{activeSection.title}</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                      {activeSection.fields.length} {activeSection.fields.length === 1 ? 'Field' : 'Fields'}
                    </span>
                  </div>
                  {activeSection.description && (
                    <p className="text-xs text-stone-500 mt-0.5">{activeSection.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Move Section Up/Down */}
                  {schema.sections.length > 1 && (
                    <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleMoveSection(schema.sections.findIndex(s => s.id === activeSection.id), 'up')}
                        disabled={schema.sections[0]?.id === activeSection.id}
                        className="p-1.5 hover:bg-stone-100 text-stone-600 disabled:opacity-30 cursor-pointer"
                        title="Move section left/up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection(schema.sections.findIndex(s => s.id === activeSection.id), 'down')}
                        disabled={schema.sections[schema.sections.length - 1]?.id === activeSection.id}
                        className="p-1.5 hover:bg-stone-100 text-stone-600 disabled:opacity-30 cursor-pointer"
                        title="Move section right/down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {activeSection.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(activeSection.id, activeSection.title)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenAddField(activeSection.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Field</span>
                  </button>
                </div>
              </div>

              {/* Field Cards List */}
              {activeSection.fields.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 space-y-3">
                  <Layers className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-sm font-semibold text-stone-700">No fields in this section yet</p>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Click the button below to add custom text inputs, dropdowns, barangay pickers, or biosecurity checks.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddField(activeSection.id)}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Field</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSection.fields.map((field, index) => {
                    const fieldMeta = FIELD_TYPE_LABELS[field.type] || {
                      name: field.type,
                      icon: '•',
                      category: 'Custom',
                    };
                    const isDragging = draggedFieldIndex === index;

                    return (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`p-4 rounded-2xl border transition-all duration-150 relative bg-white group ${
                          isDragging
                            ? 'opacity-40 border-dashed border-emerald-500 scale-[0.98]'
                            : 'border-stone-200 hover:border-stone-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Drag Handle, Icon, Label & Badges */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-700 p-1">
                              <GripVertical className="w-4 h-4" />
                            </div>

                            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-xs shrink-0 border border-stone-200">
                              {fieldMeta.icon}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-stone-900 truncate">
                                  {field.label}
                                </span>
                                {field.required && (
                                  <span className="text-red-500 font-bold text-xs" title="Required Field">
                                    *
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                                <span className="font-medium text-stone-600">{fieldMeta.name}</span>
                                <span>•</span>
                                <span
                                  className={`font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                                    field.required ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {field.required ? 'Required: ON' : 'Required: OFF'}
                                </span>
                                <span>•</span>
                                <span
                                  className={`font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                                    field.visible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {field.visible ? 'Visible: ON' : 'Hidden'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Move Up / Down Buttons for Accessibility */}
                            <button
                              type="button"
                              onClick={() => handleMoveField(activeSection.id, index, 'up')}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveField(activeSection.id, index, 'down')}
                              disabled={index === activeSection.fields.length - 1}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Visibility Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleVisible(activeSection.id, field.id)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                field.visible ? 'text-stone-500 hover:text-stone-800' : 'text-amber-600 bg-amber-50'
                              }`}
                              title={field.visible ? 'Hide Field' : 'Make Field Visible'}
                            >
                              {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateField(activeSection.id, field)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                              title="Duplicate Field"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditField(activeSection.id, field)}
                              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteField(activeSection.id, field.id, field.label)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                              title="Delete Field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Optional Sub-details preview */}
                        {field.placeholder && (
                          <div className="mt-2 text-[11px] text-stone-400 bg-stone-50/80 px-2.5 py-1 rounded-lg font-mono truncate">
                            Placeholder: &ldquo;{field.placeholder}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Registry Form Preview Panel (5 Cols) */}
        <div className="lg:col-span-5 sticky top-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                  Live Registry Form Preview
                </h3>
              </div>

              {/* Viewport Modes: Desktop | Tablet | Mobile */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewViewport === 'desktop'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('tablet')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewViewport === 'tablet'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewViewport === 'mobile'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Preview Viewport Container */}
            <div
              className={`mx-auto transition-all duration-200 bg-stone-50/80 rounded-2xl border border-stone-300/80 p-4 shadow-inner overflow-y-auto max-h-[640px] space-y-4 ${
                previewViewport === 'mobile'
                  ? 'max-w-[340px]'
                  : previewViewport === 'tablet'
                  ? 'max-w-[460px]'
                  : 'w-full'
              }`}
            >
              {/* Form Title Banner */}
              <div className="bg-emerald-800 text-white p-3 rounded-xl shadow-xs space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                  Official Republic of the Philippines • DA-MAO
                </div>
                <div className="font-bold text-xs">
                  {activeSection?.title || 'Swine Registration Form'}
                </div>
              </div>

              {/* Render Visible Fields in Active Section */}
              {activeSection && activeSection.fields.filter(f => f.visible).length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No visible fields configured for this section.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activeSection?.fields
                    .filter(f => f.visible)
                    .map((field) => (
                      <div key={field.id} className="space-y-1">
                        <label className="block text-xs font-bold text-stone-800">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>

                        {/* Render based on field type */}
                        {field.type === 'textarea' ? (
                          <textarea
                            disabled
                            placeholder={field.placeholder || 'Enter notes...'}
                            rows={2}
                            className="w-full text-xs p-2 rounded-xl bg-white border border-stone-300 text-stone-600 disabled:bg-stone-50 resize-none"
                          />
                        ) : field.type === 'dropdown' || field.type === 'barangay_select' || field.type === 'breed_select' ? (
                          <div className="relative">
                            <select
                              disabled
                              className="w-full text-xs p-2 pr-8 rounded-xl bg-white border border-stone-300 text-stone-600 disabled:bg-stone-50 appearance-none font-medium"
                            >
                              <option>{field.placeholder || 'Select an option...'}</option>
                              {field.type === 'barangay_select' ? (
                                <>
                                  <option>Labrador (Pob.)</option>
                                  <option>Biasong</option>
                                  <option>Catublian</option>
                                  <option>Poblacion</option>
                                </>
                              ) : field.type === 'breed_select' ? (
                                <>
                                  <option>Landrace</option>
                                  <option>Large White</option>
                                  <option>Duroc</option>
                                  <option>Native / Black Pig</option>
                                </>
                              ) : (
                                field.options?.map((opt, i) => <option key={i}>{opt}</option>)
                              )}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
                          </div>
                        ) : field.type === 'radio' ? (
                          <div className="space-y-1.5 pt-0.5">
                            {field.options?.map((opt, i) => (
                              <label key={i} className="flex items-center gap-2 text-xs text-stone-700">
                                <input type="radio" disabled name={field.id} defaultChecked={i === 0} className="text-emerald-600" />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : field.type === 'yes_no' ? (
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-default"
                            >
                              YES / Compliant
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 rounded-lg bg-stone-200 text-stone-600 text-xs font-bold cursor-default"
                            >
                              NO
                            </button>
                          </div>
                        ) : field.type === 'image' || field.type === 'file' ? (
                          <div className="p-3 rounded-xl border border-dashed border-stone-300 bg-white text-center space-y-1">
                            <Upload className="w-4 h-4 text-stone-400 mx-auto" />
                            <div className="text-[11px] text-stone-500 font-medium">
                              {field.type === 'image' ? 'Upload photo (JPG/PNG)' : 'Upload document (PDF/Doc)'}
                            </div>
                          </div>
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
                            disabled
                            placeholder={field.placeholder || `Enter ${field.label}...`}
                            className="w-full text-xs p-2 rounded-xl bg-white border border-stone-300 text-stone-600 disabled:bg-stone-50"
                          />
                        )}

                        {field.helpText && (
                          <p className="text-[10px] text-stone-400 italic leading-tight">
                            {field.helpText}
                          </p>
                        )}
                      </div>
                    ))}

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl opacity-90"
                    >
                      + Save Swine Registration Record
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FIELD EDITOR MODAL */}
      {editingField && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  {editingField.isNew ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </div>
                <h3 className="text-lg font-bold text-stone-900">
                  {editingField.isNew ? 'Add New Registry Field' : 'Edit Registry Field'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Field Label */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-800">
                  Field Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="e.g. Farmer Full Name"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Field Type */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-800">
                  Field Type
                </label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as RegistryFieldType)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(FIELD_TYPE_LABELS).map(([typeKey, meta]) => (
                    <option key={typeKey} value={typeKey}>
                      {meta.category}: {meta.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Placeholder */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-800">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={fieldPlaceholder}
                  onChange={(e) => setFieldPlaceholder(e.target.value)}
                  placeholder="e.g. Enter farmer's full name"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Help Text */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-800">
                  Help / Guidance Text
                </label>
                <input
                  type="text"
                  value={fieldHelpText}
                  onChange={(e) => setFieldHelpText(e.target.value)}
                  placeholder="e.g. Enter the registered farmer name as shown in official government ID"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Dropdown Options Manager (if applicable) */}
              {['dropdown', 'radio', 'checkbox', 'multiselect'].includes(fieldType) && (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <label className="block text-xs font-bold text-stone-800">
                    Dropdown & Selection Options
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {fieldOptions.map((opt, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-xs font-semibold text-stone-800 shadow-2xs"
                      >
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-stone-400 hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newOptionInput}
                      onChange={(e) => setNewOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                      placeholder="Add new option item..."
                      className="flex-1 text-xs px-3 py-1.5 rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs cursor-pointer"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              )}

              {/* Toggles for Required & Visible */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-stone-800">Required</div>
                    <div className="text-[10px] text-stone-500">Mandatory input</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFieldRequired(!fieldRequired)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      fieldRequired ? 'bg-red-600 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {fieldRequired ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="p-3 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-stone-800">Visible</div>
                    <div className="text-[10px] text-stone-500">Show in form</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFieldVisible(!fieldVisible)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      fieldVisible ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {fieldVisible ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveField}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Field</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SECTION MODAL */}
      {isAddingSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSection}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-bold text-stone-900">Add New Form Section</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-800">
                  Section Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Vaccination & Deworming Record"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-800">
                  Section Description (Optional)
                </label>
                <input
                  type="text"
                  value={newSectionDescription}
                  onChange={(e) => setNewSectionDescription(e.target.value)}
                  placeholder="e.g. Detailed dosage and schedules administered"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
              >
                Create Section
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PUBLISH CONFIRMATION MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-bold text-stone-900">Publish Registry Form?</h3>
              <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                Your customized registration form will be used for new registry submissions by Municipal Agriculture Office staff and Barangay Focal Persons.
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Total Sections:</span>
                <span className="text-stone-900">{schema.sections.length}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total Active Fields:</span>
                <span className="text-stone-900">
                  {schema.sections.reduce((acc, s) => acc + s.fields.filter(f => f.visible).length, 0)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {isFullPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-stone-900">
                  Comprehensive Registration Form Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFullPreviewOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {schema.sections.map((sec) => (
                <div key={sec.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="border-b border-stone-200 pb-2">
                    <h4 className="font-bold text-sm text-stone-900">{sec.title}</h4>
                    {sec.description && <p className="text-xs text-stone-500">{sec.description}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sec.fields.filter(f => f.visible).map((field) => (
                      <div key={field.id} className="space-y-1">
                        <div className="text-xs font-bold text-stone-700">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </div>
                        <input
                          disabled
                          placeholder={field.placeholder || `Enter ${field.label}...`}
                          className="w-full text-xs p-2 rounded-xl bg-white border border-stone-300 text-stone-600 disabled:bg-stone-100/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFullPreviewOpen(false)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
