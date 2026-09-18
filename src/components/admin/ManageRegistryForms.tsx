import React, { useState } from 'react';
import { FormInput, Plus, Trash2, Edit, Save, X, CheckCircle, ShieldCheck, Tag, User } from 'lucide-react';
import { DynamicFormField } from '../../types';
import { storageService } from '../../services/storageService';

interface ManageRegistryFormsProps {
  onRefresh: () => void;
}

export const ManageRegistryForms: React.FC<ManageRegistryFormsProps> = ({ onRefresh }) => {
  const [fields, setFields] = useState<DynamicFormField[]>(() => storageService.getDynamicFields());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingField, setEditingField] = useState<DynamicFormField | null>(null);

  // Form State
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState<DynamicFormField['type']>('text');
  const [section, setSection] = useState<DynamicFormField['section']>('farmer');
  const [required, setRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState('');
  const [placeholder, setPlaceholder] = useState('');

  const startAdd = (sec: DynamicFormField['section']) => {
    setIsAddingNew(true);
    setEditingField(null);
    setSection(sec);
    setLabel('');
    setFieldType('text');
    setRequired(false);
    setOptionsStr('');
    setPlaceholder('');
  };

  const startEdit = (field: DynamicFormField) => {
    setEditingField(field);
    setIsAddingNew(false);
    setSection(field.section);
    setLabel(field.label);
    setFieldType(field.type);
    setRequired(field.required);
    setOptionsStr(field.options ? field.options.join(', ') : '');
    setPlaceholder(field.placeholder || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      alert('Please enter a field label');
      return;
    }

    const opts =
      fieldType === 'select' && optionsStr.trim()
        ? optionsStr.split(',').map(s => s.trim()).filter(Boolean)
        : undefined;

    if (isAddingNew) {
      const newField: DynamicFormField = {
        id: 'dyn-' + Date.now(),
        label: label.trim(),
        type: fieldType,
        section,
        required,
        options: opts,
        placeholder: placeholder.trim() || undefined,
        enabled: true,
      };
      storageService.saveDynamicField(newField);
    } else if (editingField) {
      const updated: DynamicFormField = {
        ...editingField,
        label: label.trim(),
        type: fieldType,
        section,
        required,
        options: opts,
        placeholder: placeholder.trim() || undefined,
      };
      storageService.saveDynamicField(updated);
    }

    setFields(storageService.getDynamicFields());
    setIsAddingNew(false);
    setEditingField(null);
    onRefresh();
  };

  const handleDelete = (id: string, lbl: string) => {
    if (window.confirm(`Are you sure you want to remove field "${lbl}"?`)) {
      storageService.deleteDynamicField(id);
      setFields(storageService.getDynamicFields());
      onRefresh();
    }
  };

  const farmerFields = fields.filter(f => f.section === 'farmer');
  const swineFields = fields.filter(f => f.section === 'swine');
  const biosecurityFields = fields.filter(f => f.section === 'biosecurity');

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FormInput className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold text-stone-900">Dynamic Registry Form Builder</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Add, update, or remove custom input fields and compliance checklists in the official Swine & Farmer registration forms.
          </p>
        </div>
      </div>

      {/* Add / Edit Form Modal / Box */}
      {(isAddingNew || editingField) && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border-2 border-emerald-600/40 shadow-md space-y-4 text-xs animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <h3 className="font-bold text-sm text-stone-900">
              {isAddingNew ? 'Add Custom Form Field' : `Edit Form Field: ${editingField?.label}`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingField(null);
              }}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Form Section</label>
              <select
                value={section}
                onChange={e => setSection(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-medium"
              >
                <option value="farmer">👤 Section 1: Farmer & Farm Info</option>
                <option value="swine">🏷️ Section 2: Swine Specifications</option>
                <option value="biosecurity">🛡️ Section 5: Biosecurity Checklist</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Field Label *</label>
              <input
                type="text"
                required
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Cooperative Membership"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Input Field Type</label>
              <select
                value={fieldType}
                onChange={e => setFieldType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-medium"
              >
                <option value="text">Text Box (Single Line)</option>
                <option value="number">Numeric (Quantity / Amount)</option>
                <option value="select">Dropdown Select Menu</option>
                <option value="checkbox">Yes/No Checkbox</option>
                <option value="date">Date Picker</option>
              </select>
            </div>

            {fieldType === 'select' && (
              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">
                  Dropdown Options (separated by comma)
                </label>
                <input
                  type="text"
                  value={optionsStr}
                  onChange={e => setOptionsStr(e.target.value)}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Placeholder Text</label>
              <input
                type="text"
                value={placeholder}
                onChange={e => setPlaceholder(e.target.value)}
                placeholder="Hint for user..."
                className="w-full px-3 py-2 rounded-lg border border-stone-300"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={e => setRequired(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300"
                />
                <span>Mandatory / Required Field</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingField(null);
              }}
              className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 font-semibold text-stone-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Field
            </button>
          </div>
        </form>
      )}

      {/* 3 Sections Display */}
      <div className="space-y-6">
        {/* Section 1: Farmer Info Fields */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-stone-900 text-sm">
                Section 1: Farmer & Farm Fields ({farmerFields.length} custom)
              </h3>
            </div>
            <button
              onClick={() => startAdd('farmer')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Field to Farmer Info
            </button>
          </div>

          {farmerFields.length === 0 ? (
            <p className="text-xs text-stone-400 py-2">Using core standard fields. No custom fields added yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {farmerFields.map(f => (
                <div key={f.id} className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900 block">{f.label}</span>
                    <span className="text-[10px] text-stone-500 capitalize">
                      Type: {f.type} {f.required && '• Required'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(f)} className="p-1 text-stone-500 hover:text-stone-800 cursor-pointer">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(f.id, f.label)} className="p-1 text-red-500 hover:text-red-700 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Swine Specs Fields */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-stone-900 text-sm">
                Section 2: Swine Specifications Fields ({swineFields.length} custom)
              </h3>
            </div>
            <button
              onClick={() => startAdd('swine')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Field to Swine Specs
            </button>
          </div>

          {swineFields.length === 0 ? (
            <p className="text-xs text-stone-400 py-2">Using core standard fields. No custom fields added yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {swineFields.map(f => (
                <div key={f.id} className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900 block">{f.label}</span>
                    <span className="text-[10px] text-stone-500 capitalize">
                      Type: {f.type} {f.required && '• Required'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(f)} className="p-1 text-stone-500 hover:text-stone-800 cursor-pointer">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(f.id, f.label)} className="p-1 text-red-500 hover:text-red-700 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Biosecurity Checklist Fields */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-stone-900 text-sm">
                Section 5: ASF Biosecurity Custom Checklists ({biosecurityFields.length} custom)
              </h3>
            </div>
            <button
              onClick={() => startAdd('biosecurity')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Biosecurity Compliance Check
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {biosecurityFields.map(f => (
              <div key={f.id} className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 block">{f.label}</span>
                  <span className="text-[10px] text-stone-500">Inspection Checklist Item</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(f)} className="p-1 text-stone-500 hover:text-stone-800 cursor-pointer">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(f.id, f.label)} className="p-1 text-red-500 hover:text-red-700 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
