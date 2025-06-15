import React, { useState, useEffect, useCallback } from 'react';
import { ClinicSettingsData, SettingsPageProps, AnnualSalesCategoryKey, DayKey, DaySpecificHours } from '../types';
import { CLINIC_SETTINGS_STORAGE_KEY, DAY_KEYS, DAY_NAMES_JP } from '../constants';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils';
import PageTitle from '../components/PageTitle';

const SettingsPage: React.FC<SettingsPageProps> = ({ onSettingsSave, clinicSettings: initialSettings }) => {
    const [settings, setSettings] = useState<ClinicSettingsData>(initialSettings);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<ClinicSettingsData>(initialSettings);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const initializeDaySettings = useCallback((existingSettings?: Partial<Record<DayKey, DaySpecificHours>>): Partial<Record<DayKey, DaySpecificHours>> => {
        const defaults: Partial<Record<DayKey, DaySpecificHours>> = {};
        DAY_KEYS.forEach(key => {
            defaults[key] = existingSettings?.[key] || { type: 'default' };
        });
        return defaults;
    }, []);


    useEffect(() => {
        const initializedInitialSettings = {
            ...initialSettings,
            daySettings: initializeDaySettings(initialSettings.daySettings)
        };
        setSettings(initializedInitialSettings);
        setFormData(initializedInitialSettings);
        if (Object.keys(initialSettings).filter(k => k !== 'daySettings').length === 0 && !isEditing) {
            setIsEditing(true);
        }
    }, [initialSettings, isEditing, initializeDaySettings]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['numberOfUnits', 'annualTargetInsurance', 'annualTargetPrivate', 'annualTargetProducts'].includes(name);
        
        if (isNumberField) {
            setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDaySettingChange = (dayKey: DayKey, field: keyof DaySpecificHours | 'type', value: string) => {
        setFormData(prev => {
            const daySetting = prev.daySettings?.[dayKey] || { type: 'default' };
            let updatedDaySetting: DaySpecificHours;

            if (field === 'type') {
                updatedDaySetting = { ...daySetting, type: value as DaySpecificHours['type'] };
                // Reset custom times if switching away from custom
                if (value !== 'custom') {
                    delete updatedDaySetting.customStartTime;
                    delete updatedDaySetting.customEndTime;
                    delete updatedDaySetting.customBreakStartTime;
                    delete updatedDaySetting.customBreakEndTime;
                }
            } else {
                updatedDaySetting = { ...daySetting, [field]: value === '' ? undefined : value };
            }
            
            return {
                ...prev,
                daySettings: {
                    ...prev.daySettings,
                    [dayKey]: updatedDaySetting,
                }
            };
        });
    };
    
    const handleLogoFileProcessing = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setFormData(prev => ({ ...prev, logoImage: loadEvent.target?.result as string }));
            };
            reader.readAsDataURL(file);
            setFeedbackMessage(null);
        } else if (file) {
            setFeedbackMessage('画像ファイルを選択してください。 (PNG, JPG, GIFなど)');
        }
    };

    const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setDragging(false);
        handleLogoFileProcessing(e.dataTransfer.files[0]);
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleLogoFileProcessing(e.target.files?.[0] || null);
    };

    const validateTime = (time?: string): boolean => {
        if (!time) return true; // Optional fields are valid if empty
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
    };

    const timeToMinutes = (time?: string): number | null => {
        if (!time || !validateTime(time)) return null;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const handleSaveSettings = () => {
        // Basic Validations
        if (formData.numberOfUnits !== undefined && (isNaN(formData.numberOfUnits) || formData.numberOfUnits < 0 || formData.numberOfUnits > 50)) {
            setFeedbackMessage('ユニット数は0から50の間で入力してください。'); return;
        }

        // Validate default times
        if (!validateTime(formData.defaultClinicStartTime) || !validateTime(formData.defaultClinicEndTime) ||
            !validateTime(formData.defaultBreakStartTime) || !validateTime(formData.defaultBreakEndTime)) {
            setFeedbackMessage('通常診療時間または休憩時間の形式が正しくありません (HH:MM)。'); return;
        }

        const defaultStartMins = timeToMinutes(formData.defaultClinicStartTime);
        const defaultEndMins = timeToMinutes(formData.defaultClinicEndTime);
        if (defaultStartMins !== null && defaultEndMins !== null && defaultStartMins >= defaultEndMins) {
            setFeedbackMessage('通常診療終了時間は通常診療開始時間より後に設定してください。'); return;
        }
        
        const defaultBreakStartMins = timeToMinutes(formData.defaultBreakStartTime);
        const defaultBreakEndMins = timeToMinutes(formData.defaultBreakEndTime);
        if (defaultBreakStartMins !== null && defaultBreakEndMins !== null) {
            if (defaultBreakStartMins >= defaultBreakEndMins) {
                setFeedbackMessage('通常休憩終了時間は通常休憩開始時間より後に設定してください。'); return;
            }
            if (defaultStartMins !== null && defaultEndMins !== null &&
                (defaultBreakStartMins < defaultStartMins || defaultBreakEndMins > defaultEndMins || defaultBreakEndMins < defaultStartMins || defaultBreakStartMins > defaultEndMins )) {
                 //This validation can be complex if break can be outside operating hours. Assuming break must be within.
                 //Simplified: check if break start is after op start AND break end is before op end.
                 if(defaultBreakStartMins < defaultStartMins || defaultBreakEndMins > defaultEndMins){
                    setFeedbackMessage('通常休憩時間は診療時間内に設定してください。'); return;
                 }
            }
        } else if (defaultBreakStartMins !== null || defaultBreakEndMins !== null) {
            // One break time is set but not the other
             setFeedbackMessage('通常休憩時間を設定する場合は、開始時刻と終了時刻の両方を入力してください。'); return;
        }


        // Validate day-specific custom times
        if (formData.daySettings) {
            for (const dayKey of DAY_KEYS) {
                const daySetting = formData.daySettings[dayKey];
                if (daySetting?.type === 'custom') {
                    if (!validateTime(daySetting.customStartTime) || !validateTime(daySetting.customEndTime) ||
                        !validateTime(daySetting.customBreakStartTime) || !validateTime(daySetting.customBreakEndTime)) {
                        setFeedbackMessage(`${DAY_NAMES_JP[dayKey]}のカスタム時間または休憩時間の形式が正しくありません (HH:MM)。`); return;
                    }

                    const customStartMins = timeToMinutes(daySetting.customStartTime);
                    const customEndMins = timeToMinutes(daySetting.customEndTime);
                     if (customStartMins !== null && customEndMins !== null && customStartMins >= customEndMins) {
                        setFeedbackMessage(`${DAY_NAMES_JP[dayKey]}のカスタム診療終了時間は開始時間より後に設定してください。`); return;
                    }

                    const customBreakStartMins = timeToMinutes(daySetting.customBreakStartTime);
                    const customBreakEndMins = timeToMinutes(daySetting.customBreakEndTime);
                    if (customBreakStartMins !== null && customBreakEndMins !== null) {
                        if (customBreakStartMins >= customBreakEndMins) {
                           setFeedbackMessage(`${DAY_NAMES_JP[dayKey]}のカスタム休憩終了時間は開始時間より後に設定してください。`); return;
                        }
                        if (customStartMins !== null && customEndMins !== null && 
                            (customBreakStartMins < customStartMins || customBreakEndMins > customEndMins || customBreakEndMins < customStartMins || customBreakStartMins > customEndMins )) {
                            if(customBreakStartMins < customStartMins || customBreakEndMins > customEndMins){
                                setFeedbackMessage(`${DAY_NAMES_JP[dayKey]}のカスタム休憩時間は診療時間内に設定してください。`); return;
                            }
                        }
                    } else if (customBreakStartMins !== null || customBreakEndMins !== null) {
                         setFeedbackMessage(`${DAY_NAMES_JP[dayKey]}のカスタム休憩時間を設定する場合は、開始時刻と終了時刻の両方を入力してください。`); return;
                    }
                }
            }
        }
        
        saveToLocalStorage(CLINIC_SETTINGS_STORAGE_KEY, formData);
        setSettings(formData); 
        setIsEditing(false);
        setFeedbackMessage('設定が保存されました。');
        onSettingsSave(); 
        setTimeout(() => setFeedbackMessage(null), 3000);
    };
    
    const handleEditToggle = () => {
        if (isEditing) { 
            const initializedInitialSettings = {
                ...settings,
                daySettings: initializeDaySettings(settings.daySettings)
            };
            setFormData(initializedInitialSettings); 
        } else { 
            const initializedCurrentSettings = {
                 ...settings,
                daySettings: initializeDaySettings(settings.daySettings)
            };
            setFormData(initializedCurrentSettings); 
        }
        setIsEditing(!isEditing);
        setFeedbackMessage(null); 
    };

    const targetFields: {key: keyof ClinicSettingsData, label: string, category: AnnualSalesCategoryKey | 'total' }[] = [
        { key: 'annualTargetInsurance', label: '保険診療 年間売上目標金額(円)', category: 'insurance' },
        { key: 'annualTargetPrivate', label: '自費治療 年間売上目標金額(円)', category: 'private' },
        { key: 'annualTargetProducts', label: '物販 年間売上目標金額(円)', category: 'products' },
    ];

    const baseInfoFields = [
        { key: 'clinicName', label: '医院名' },
        { key: 'directorName', label: '院長名' },
        { key: 'address', label: '住所' },
        { key: 'phoneNumber', label: '電話番号' },
        { key: 'numberOfUnits', label: 'ユニット数', type: 'number' },
    ];
    
    const defaultHoursFields = [
        { key: 'defaultClinicStartTime', label: '通常診療開始時刻', type: 'time' },
        { key: 'defaultClinicEndTime', label: '通常診療終了時刻', type: 'time' },
        { key: 'defaultBreakStartTime', label: '通常休憩開始時刻', type: 'time' },
        { key: 'defaultBreakEndTime', label: '通常休憩終了時刻', type: 'time' },
    ];

    const renderDaySettingInput = (dayKey: DayKey, dayLabel: string) => {
        const currentSetting = formData.daySettings?.[dayKey] || { type: 'default' };
        return (
            <div key={dayKey} className="p-3 border rounded-md bg-gray-50">
                <h5 className="text-sm font-semibold text-gray-600 mb-2">{dayLabel}</h5>
                <div className="space-y-1.5">
                    {(['default', 'holiday', 'custom'] as DaySpecificHours['type'][]).map(typeValue => (
                        <label key={typeValue} className="flex items-center text-xs">
                            <input 
                                type="radio" 
                                name={`dayType-${dayKey}`} 
                                value={typeValue}
                                checked={currentSetting.type === typeValue}
                                onChange={(e) => handleDaySettingChange(dayKey, 'type', e.target.value)}
                                className="form-radio mr-1.5"
                            />
                            {typeValue === 'default' ? '通常通り' : typeValue === 'holiday' ? '休診日' : 'カスタム設定'}
                        </label>
                    ))}
                </div>
                {currentSetting.type === 'custom' && (
                    <div className="mt-2 space-y-2 pl-2 border-l-2 border-blue-200">
                        {(['customStartTime', 'customEndTime', 'customBreakStartTime', 'customBreakEndTime'] as const).map(fieldKey => (
                             <div key={fieldKey}>
                                <label className="block text-xxs font-medium text-gray-500">
                                    {fieldKey === 'customStartTime' ? '開始時刻' : fieldKey === 'customEndTime' ? '終了時刻' : fieldKey === 'customBreakStartTime' ? '休憩開始' : '休憩終了'}
                                </label>
                                <input 
                                    type="time" 
                                    value={currentSetting[fieldKey] || ''}
                                    onChange={(e) => handleDaySettingChange(dayKey, fieldKey, e.target.value)}
                                    className="form-input w-full text-xs p-1 mt-0.5"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };


    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <PageTitle title="医院設定" />
            <div className="mb-4 flex justify-end">
                <button 
                    className={`px-6 py-2 font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                                ${isEditing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400' 
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'}`}
                    onClick={handleEditToggle}
                >
                    {isEditing ? 'キャンセル' : '編集'}
                </button>
            </div>
             {feedbackMessage && (
                <div className={`mb-4 p-3 rounded-md text-sm ${feedbackMessage.includes('保存') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {feedbackMessage}
                </div>
            )}

            <div className="flex-1 overflow-y-auto bg-white p-6 rounded-lg shadow-md">
                {isEditing ? (
                    // --- EDIT MODE ---
                    <div className="space-y-8">
                        {/* 基本情報セクション */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">基本情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {baseInfoFields.map(field => (
                                    <div key={field.key}>
                                        <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                        <input 
                                            type={field.type || 'text'} 
                                            id={field.key} name={field.key} 
                                            value={(formData[field.key as keyof ClinicSettingsData] as string | number | undefined) ?? ''}
                                            onChange={handleInputChange} 
                                            min={field.key === 'numberOfUnits' ? "0" : undefined}
                                            max={field.key === 'numberOfUnits' ? "50" : undefined}
                                            className="form-input w-full"
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ロゴ画像</label>
                                    <div 
                                        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-400 ${dragging ? 'border-blue-500 bg-blue-50' : ''}`}
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
                                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
                                        onDrop={handleLogoDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="space-y-1 text-center">
                                            {formData.logoImage ? (
                                                <img src={formData.logoImage} alt="ロゴプレビュー" className="mx-auto h-20 w-auto object-contain rounded mb-1"/>
                                            ) : (
                                                <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            )}
                                            <div className="flex text-sm text-gray-600">
                                                <p className="pl-1">{formData.logoImage ? '画像を置き換える' : '画像をアップロード'}</p>
                                            </div>
                                            <p className="text-xs text-gray-500">ドラッグ＆ドロップまたはクリック</p>
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoFileChange} className="sr-only" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        {/* 通常診療時間セクション */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">通常診療時間</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {defaultHoursFields.map(field => (
                                     <div key={field.key}>
                                        <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                        <input type={field.type} id={field.key} name={field.key}
                                               value={(formData[field.key as keyof ClinicSettingsData] as string | undefined) ?? ''}
                                               onChange={handleInputChange} className="form-input w-full"/>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 曜日別診療時間設定セクション */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">曜日別診療時間設定</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {DAY_KEYS.map(dayKey => renderDaySettingInput(dayKey, DAY_NAMES_JP[dayKey]))}
                            </div>
                        </section>


                        {/* 年間売上目標セクション */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">年間売上目標</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {targetFields.map(fieldInfo => (
                                    <div key={fieldInfo.key}>
                                        <label htmlFor={fieldInfo.key} className="block text-sm font-medium text-gray-700 mb-1">{fieldInfo.label}</label>
                                        <input type="number" id={fieldInfo.key} name={fieldInfo.key} 
                                               value={(formData[fieldInfo.key as keyof ClinicSettingsData] as number | undefined) ?? ''}
                                               onChange={handleInputChange} min="0" className="form-input w-full"/>
                                    </div>
                                ))}
                            </div>
                        </section>
                        
                        {/* ログイン情報セクション (未実装表示) */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">ログイン情報 <span className="text-xs text-red-500">(未実装)</span></h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">メールアドレス</label>
                                    <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleInputChange} disabled className="form-input w-full bg-gray-100 cursor-not-allowed"/>
                                </div>
                                <div>
                                    <label htmlFor="passwordInput" className="block text-sm font-medium text-gray-400 mb-1">パスワード</label>
                                    <input type="password" id="passwordInput" name="passwordInput" value={formData.passwordInput || ''} onChange={handleInputChange} disabled className="form-input w-full bg-gray-100 cursor-not-allowed"/>
                                </div>
                            </div>
                        </section>

                        <div className="pt-5 border-t">
                            <div className="flex justify-end">
                                <button className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md font-semibold" onClick={handleSaveSettings}>保存</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- DISPLAY MODE ---
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">基本情報</h3>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                {baseInfoFields.map(field => (
                                    <div key={field.key} className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">{field.label}:</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {(settings[field.key as keyof ClinicSettingsData] as string | number | undefined)?.toString() ?? '未設定'}
                                            {field.key === 'numberOfUnits' && settings.numberOfUnits !== undefined ? ' 台' : ''}
                                        </dd>
                                    </div>
                                ))}
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">ロゴ画像:</dt>
                                    <dd className="mt-1">
                                        {settings.logoImage ? 
                                            <img src={settings.logoImage} alt="医院ロゴ" className="h-20 w-auto object-contain rounded border p-1"/> : 
                                        <span className="text-sm text-gray-900">未設定</span>}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">通常診療時間</h3>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                {defaultHoursFields.map(field => (
                                     <div key={field.key} className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">{field.label}:</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{(settings[field.key as keyof ClinicSettingsData] as string | undefined) ?? '未設定'}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>

                        <section>
                             <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">曜日別診療時間設定</h3>
                             <div className="space-y-2">
                                {DAY_KEYS.map(dayKey => {
                                    const daySetting = settings.daySettings?.[dayKey];
                                    let displayText = '未設定';
                                    if (daySetting) {
                                        if (daySetting.type === 'default') displayText = '通常通り';
                                        else if (daySetting.type === 'holiday') displayText = '休診日';
                                        else if (daySetting.type === 'custom') {
                                            displayText = `カスタム: ${daySetting.customStartTime || '未設定'} - ${daySetting.customEndTime || '未設定'}`;
                                            if (daySetting.customBreakStartTime && daySetting.customBreakEndTime) {
                                                displayText += ` (休憩: ${daySetting.customBreakStartTime} - ${daySetting.customBreakEndTime})`;
                                            }
                                        }
                                    }
                                    return (
                                        <div key={dayKey} className="flex justify-between items-center text-sm p-1.5 bg-gray-50 rounded">
                                            <span className="font-medium text-gray-600">{DAY_NAMES_JP[dayKey]}:</span>
                                            <span className="text-gray-800">{displayText}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>


                        <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">年間売上目標</h3>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                {targetFields.map(fieldInfo => (
                                    <div key={fieldInfo.key} className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">{fieldInfo.label.replace('金額(円)','').trim()}:</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {(settings[fieldInfo.key as keyof ClinicSettingsData] as number | undefined) !== undefined ? 
                                                `¥${Number(settings[fieldInfo.key as keyof ClinicSettingsData]).toLocaleString()}` : 
                                            '未設定'}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                         <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">ログイン情報</h3>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">メールアドレス:</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{settings.email || '未設定 (未実装)'}</dd>
                                </div>
                            </dl>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
