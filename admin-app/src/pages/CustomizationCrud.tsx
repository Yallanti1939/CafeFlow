import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { productService, CustomizationGroup, CustomizationOption } from '../services/productService';
import { Plus, Edit2, Trash2, X, Sliders, ToggleLeft, ToggleRight, Check } from 'lucide-react';

export default function CustomizationCrud() {
  const [groups, setGroups] = useState<CustomizationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Group Form Modal State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupEditId, setGroupEditId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState('');
  const [selectionType, setSelectionType] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [isRequired, setIsRequired] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);

  // Option Form Modal State
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [optionEditId, setOptionEditId] = useState<number | null>(null);
  const [optionName, setOptionName] = useState('');
  const [optionPrice, setOptionPrice] = useState(0);
  const [optionIsAvailable, setOptionIsAvailable] = useState(true);
  const [submittingOption, setSubmittingOption] = useState(false);

  useEffect(() => {
    loadCustomizations();
  }, []);

  async function loadCustomizations() {
    try {
      const data = await productService.getCustomizations();
      setGroups(data);
    } catch (e) {
      console.error('Failed to load customizations', e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreateGroup = () => {
    setGroupEditId(null);
    setGroupName('');
    setSelectionType('SINGLE');
    setIsRequired(false);
    setShowGroupModal(true);
  };

  const handleOpenEditGroup = (g: CustomizationGroup) => {
    setGroupEditId(g.id!);
    setGroupName(g.name);
    setSelectionType(g.selectionType);
    setIsRequired(g.isRequired);
    setShowGroupModal(true);
  };

  const handleDeleteGroup = async (id: number) => {
    const confirmDel = window.confirm("Are you sure you want to delete this customization group and all of its option definitions?");
    if (!confirmDel) return;

    try {
      await productService.deleteCustomizationGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      alert("Customization group deleted!");
    } catch (e) {
      alert("Failed to delete group.");
    }
  };

  const handleOpenCreateOption = (groupId: number) => {
    setSelectedGroupId(groupId);
    setOptionEditId(null);
    setOptionName('');
    setOptionPrice(0);
    setOptionIsAvailable(true);
    setShowOptionModal(true);
  };

  const handleOpenEditOption = (groupId: number, option: CustomizationOption) => {
    setSelectedGroupId(groupId);
    setOptionEditId(option.id!);
    setOptionName(option.name);
    setOptionPrice(option.price);
    setOptionIsAvailable(option.isAvailable !== false);
    setShowOptionModal(true);
  };

  const handleDeleteOption = async (optionId: number) => {
    const confirmDel = window.confirm("Are you sure you want to delete this option modifier?");
    if (!confirmDel) return;

    try {
      await productService.deleteCustomizationOption(optionId);
      alert("Option deleted successfully!");
      loadCustomizations();
    } catch (e) {
      alert("Failed to delete option.");
    }
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingGroup(true);

    const payload: CustomizationGroup = {
      name: groupName,
      selectionType,
      isRequired
    };

    try {
      if (groupEditId !== null) {
        await productService.updateCustomizationGroup(groupEditId, payload);
      } else {
        await productService.createCustomizationGroup(payload);
      }
      setShowGroupModal(false);
      loadCustomizations();
    } catch (err: any) {
      alert(err.response?.data || 'Failed to save group details.');
    } finally {
      setSubmittingGroup(false);
    }
  };

  const handleSubmitOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroupId === null) return;

    setSubmittingOption(true);
    const payload: CustomizationOption = {
      name: optionName,
      price: optionPrice,
      isAvailable: optionIsAvailable
    };

    try {
      if (optionEditId !== null) {
        await productService.updateCustomizationOption(optionEditId, payload);
      } else {
        await productService.addCustomizationOption(selectedGroupId, payload);
      }
      setShowOptionModal(false);
      loadCustomizations();
    } catch (err: any) {
      alert(err.response?.data || 'Failed to save option details.');
    } finally {
      setSubmittingOption(false);
    }
  };

  const handleToggleOptionAvailability = async (option: CustomizationOption) => {
    try {
      const toggledVal = !(option.isAvailable !== false);
      await productService.updateCustomizationOption(option.id!, {
        name: option.name,
        price: option.price,
        isAvailable: toggledVal
      });
      loadCustomizations();
    } catch (e) {
      alert("Failed to toggle option availability.");
    }
  };

  return (
    <div className="flex bg-cafeflow-bg min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto space-y-8 max-w-7xl mx-auto">
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Menu Customizations</h1>
            <p className="text-cafeflow-textMuted text-sm font-medium mt-1">Configure coffee modifiers, sizes, milk choices, and extra toppings.</p>
          </div>
          <button 
            onClick={handleOpenCreateGroup}
            className="flex items-center gap-2 px-5 py-3 bg-cafeflow-accent text-white rounded-2xl hover:bg-cafeflow-dark transition-all text-sm font-bold shadow-md"
          >
            <Plus className="w-5 h-5" /> Add Group
          </button>
        </div>

        {/* Group Modal */}
        {showGroupModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl relative">
              <button 
                onClick={() => setShowGroupModal(false)}
                className="absolute top-5 right-5 text-cafeflow-textMuted hover:text-cafeflow-dark"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="font-serif text-3xl font-bold text-cafeflow-dark border-b border-cafeflow-light/20 pb-3">
                {groupEditId ? 'Edit Modifier Group' : 'Create Modifier Group'}
              </h3>

              <form onSubmit={handleSubmitGroup} className="space-y-5 text-sm font-bold text-cafeflow-textMuted">
                <div className="space-y-1.5">
                  <label htmlFor="group-name-input">Group Name (e.g. Size Options, Milk Type)</label>
                  <input 
                    id="group-name-input"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="select-type-input">Selection Mode</label>
                  <select 
                    id="select-type-input"
                    value={selectionType}
                    onChange={(e) => setSelectionType(e.target.value as any)}
                    className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                  >
                    <option value="SINGLE">Single Selection (Radio Buttons)</option>
                    <option value="MULTI">Multiple Selection (Checkboxes)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input 
                    id="group-req"
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-cafeflow-accent border-cafeflow-light/65"
                  />
                  <label htmlFor="group-req" className="text-sm font-bold text-cafeflow-dark">Selection is Mandatory (Required option)</label>
                </div>

                <div className="pt-4 border-t border-cafeflow-light/20 flex gap-3">
                  <button
                    type="submit"
                    disabled={submittingGroup}
                    className="flex-1 bg-cafeflow-accent text-white font-bold py-3 rounded-xl text-sm hover:bg-cafeflow-dark shadow-md"
                  >
                    {submittingGroup ? 'Saving...' : 'Save Group'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGroupModal(false)}
                    className="px-5 py-3 bg-cafeflow-bgSecondary text-cafeflow-text font-bold rounded-xl text-sm hover:bg-cafeflow-light/20"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Option Modal */}
        {showOptionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl relative">
              <button 
                onClick={() => setShowOptionModal(false)}
                className="absolute top-5 right-5 text-cafeflow-textMuted hover:text-cafeflow-dark"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="font-serif text-3xl font-bold text-cafeflow-dark border-b border-cafeflow-light/20 pb-3">
                {optionEditId ? 'Edit Modifier Option' : 'Add Modifier Option'}
              </h3>

              <form onSubmit={handleSubmitOption} className="space-y-5 text-sm font-bold text-cafeflow-textMuted">
                <div className="space-y-1.5">
                  <label htmlFor="opt-name-input">Option Name (e.g. Almond Milk, Double Shot, Large)</label>
                  <input 
                    id="opt-name-input"
                    type="text"
                    value={optionName}
                    onChange={(e) => setOptionName(e.target.value)}
                    className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="opt-price-input">Additional Cost (₹)</label>
                  <input 
                    id="opt-price-input"
                    type="number"
                    step="0.01"
                    value={optionPrice}
                    onChange={(e) => setOptionPrice(Number(e.target.value))}
                    className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                    required
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input 
                    id="opt-avail"
                    type="checkbox"
                    checked={optionIsAvailable}
                    onChange={(e) => setOptionIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-cafeflow-accent border-cafeflow-light/65"
                  />
                  <label htmlFor="opt-avail" className="text-sm font-bold text-cafeflow-dark">Option Available for Selection</label>
                </div>

                <div className="pt-4 border-t border-cafeflow-light/20 flex gap-3">
                  <button
                    type="submit"
                    disabled={submittingOption}
                    className="flex-1 bg-cafeflow-accent text-white font-bold py-3 rounded-xl text-sm hover:bg-cafeflow-dark shadow-md"
                  >
                    {submittingOption ? 'Saving...' : 'Save Option'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOptionModal(false)}
                    className="px-5 py-3 bg-cafeflow-bgSecondary text-cafeflow-text font-bold rounded-xl text-sm hover:bg-cafeflow-light/20"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Groups Grid */}
        {loading ? (
          <div className="text-center py-20 text-cafeflow-textMuted font-medium animate-pulse">Loading customization definitions...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-cafeflow-card rounded-3xl border border-cafeflow-light/35 shadow-sm">
            <p className="text-cafeflow-textMuted text-base font-semibold">No modifier groups registered. Click Add Group above to start.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {groups.map((g) => (
              <div key={g.id} className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-7 shadow-sm space-y-6">
                <div className="flex justify-between items-start border-b border-cafeflow-light/20 pb-4">
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-2xl text-cafeflow-dark">{g.name}</h3>
                    <div className="flex gap-2 items-center text-xs text-cafeflow-textMuted uppercase font-bold">
                      <span>{g.selectionType === 'SINGLE' ? 'Single Select' : 'Multi-Select'}</span>
                      {g.isRequired && <span className="bg-cafeflow-accent/15 text-cafeflow-accent px-2 py-0.5 rounded-full font-sans font-bold">Required</span>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEditGroup(g)}
                      className="p-2 hover:bg-cafeflow-bgSecondary rounded-xl text-cafeflow-accent transition-all"
                      title="Edit Group"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteGroup(g.id!)}
                      className="p-2 hover:bg-red-50 rounded-xl text-red-600 transition-all"
                      title="Delete Group"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Options lists inside group */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-extrabold tracking-wider text-cafeflow-textMuted uppercase">
                    <span>Options List</span>
                    <button 
                      onClick={() => handleOpenCreateOption(g.id!)}
                      className="text-cafeflow-accent hover:underline flex items-center gap-1 font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" /> add option
                    </button>
                  </div>

                  {!g.options || g.options.length === 0 ? (
                    <p className="text-xs text-cafeflow-textMuted italic py-4 text-center font-medium">No options defined in this group.</p>
                  ) : (
                    <div className="divide-y divide-cafeflow-light/15 bg-cafeflow-bg border border-cafeflow-light/35 rounded-2xl overflow-hidden">
                      {g.options.map((opt) => (
                        <div key={opt.id} className="p-4 flex justify-between items-center text-sm md:text-base font-semibold">
                          <div className="flex items-center gap-3">
                            {/* Toggle availability switch */}
                            <button
                              onClick={() => handleToggleOptionAvailability(opt)}
                              className="text-cafeflow-accent p-0.5"
                              title={opt.isAvailable !== false ? 'Deactivate Option' : 'Activate Option'}
                            >
                              {opt.isAvailable !== false ? (
                                <ToggleRight className="w-6 h-6 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-gray-400" />
                              )}
                            </button>
                            <div className="space-y-0.5">
                              <span className={`text-cafeflow-dark font-bold block ${opt.isAvailable === false ? 'line-through text-cafeflow-textMuted/50' : ''}`}>{opt.name}</span>
                              <span className="text-xs text-cafeflow-accent font-bold">Price: {opt.price > 0 ? `+₹${opt.price}` : 'Free'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleOpenEditOption(g.id!, opt)}
                              className="p-1.5 hover:bg-cafeflow-bgSecondary text-cafeflow-textMuted rounded-lg transition-all"
                              title="Edit Option"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteOption(opt.id!)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-all"
                              title="Delete Option"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
