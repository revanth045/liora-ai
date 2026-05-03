
import React, { useState, useEffect } from 'react';
import { useSession } from '../src/auth/useSession';
import { useUserProfile } from '../hooks/useUserProfile';
import { useConversation } from '../store/conversation';
import { getAuth } from '../src/auth';
import { Icon } from './Icon';
import { StoredUserProfile, View, ReminderSettings, PastOrder, ChatMessage, UserProfileData } from '../types';
import { useReminders } from '../hooks/useReminders';
import { useFavorites } from '../src/hooks/useFavorites';
import { usePastOrders } from '../hooks/usePastOrders';
import { createProfileFromForm, generateSummaryForProfileData } from '../services/geminiService';
import { Spinner } from './Spinner';
import { useSubscription } from '../src/hooks/useSubscription';

interface AccountSettingsProps {
    setView: (view: View) => void;
}

type ProfileTab = 'profile' | 'favorites' | 'orders' | 'settings' | 'subscription';

const budgetOptions = ['$', '$$', '$$$'];
const cuisineOptions = ['Italian', 'Mexican', 'Japanese', 'Chinese', 'American', 'Mediterranean', 'Indian'];
const spiceOptions = ['None', 'Mild', 'Medium', 'Hot'];
const allergyOptions = ['Peanut', 'Tree nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'None'];
const dietOptions = ['None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Halal', 'Kosher', 'Low-carb'];
const vibeOptions = ['Casual', 'Romantic', 'Family-friendly', 'Luxury', 'Nightlife'];

const inputStyles = "mt-1 block w-full p-2 border border-cream-200 rounded-md shadow-sm focus:ring-brand-400/30 focus:border-brand-400 bg-white text-stone-800";
const labelStyles = "block text-sm font-medium text-stone-600";

export const AccountSettings: React.FC<AccountSettingsProps> = ({ setView }) => {
    const session = useSession();
    const { profile, saveProfile, clearProfile, updateAiPreferences } = useUserProfile();
    const { reset: resetConversation } = useConversation();
    const auth = getAuth();
    const { settings: reminderSettings, saveSettings: saveReminderSettings } = useReminders();
    const { favorites, removeFavorite } = useFavorites();
    const { pastOrders } = usePastOrders();
    const { isPremium, plan, isTrial, renewalDate, canceled, openModal, cancel, restore } = useSubscription();
    
    const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
    const [reminderForm, setReminderForm] = useState<ReminderSettings | null>(null);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    // Profile Creation Form State
    const [formData, setFormData] = useState({
        name: '',
        city: '',
        budget: '$$',
        cuisines: [] as string[],
        otherCuisine: '',
        spice: 'Mild',
        allergies: [] as string[],
        otherAllergy: '',
        diet: 'None',
        vibe: 'Casual'
    });
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (reminderSettings) {
            setReminderForm(reminderSettings);
        }
    }, [reminderSettings]);

    const handleLogout = async () => {
        await auth.signOut();
    };

    const handleResetProfile = () => {
        if (window.confirm("Are you sure you want to reset your profile? This action cannot be undone.")) {
            clearProfile();
            resetConversation();
        }
    };
    
    const handleClearHistory = () => {
         if (window.confirm("Are you sure you want to clear your conversation history?")) {
            resetConversation();
        }
    };

    const handlePrefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const [category, setting] = name.split('.');
        
        if (category === 'ai' && (setting === 'tone' || setting === 'style')) {
             updateAiPreferences({
                [setting]: value as any,
            });
        }
    };

    const handleReminderFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const [category, field] = name.split('.');

        if (!reminderForm) return;

        if (field === 'enabled' && checked && notificationPermission !== 'granted') {
            Notification.requestPermission().then(permission => {
                setNotificationPermission(permission);
                if (permission !== 'granted') {
                    alert("Notifications are required for reminders. Please enable them in your browser settings to use this feature.");
                    return; 
                }
            });
        }

        setReminderForm(prev => {
            if (!prev) return null;
            const newSettings = JSON.parse(JSON.stringify(prev));
            (newSettings as any)[category][field] = type === 'checkbox' ? checked : value;
            return newSettings;
        });
    };

    const handleSaveReminders = () => {
        if (reminderForm) {
            saveReminderSettings(reminderForm);
            alert("Reminder settings saved!");
        }
    };

    // --- Profile Form Handlers ---
    const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleChipToggle = (field: 'cuisines' | 'allergies', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingProfile(true);
        setFormError('');

        const finalCuisines = formData.otherCuisine.trim()
            ? [...formData.cuisines, formData.otherCuisine.trim()]
            : formData.cuisines;
        
        const finalAllergies = formData.otherAllergy.trim()
            ? [...formData.allergies, formData.otherAllergy.trim()]
            : formData.allergies;

        const dataToSend = {
            ...formData,
            cuisines: finalCuisines,
            allergies: finalAllergies.includes('None') ? [] : finalAllergies,
            avoid: finalAllergies.includes('None') ? [] : finalAllergies, // Using allergies for avoid as well
        };

        try {
            const profileData = await createProfileFromForm(dataToSend);
            const summary = await generateSummaryForProfileData(profileData);
            const profileToSave: StoredUserProfile = { summary, profile: profileData };
            saveProfile(profileToSave);
            setSuccessMessage("Profile saved! Liora will now personalize everything for you.");
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            console.error("Failed to create profile:", err);
            setFormError("Sorry, there was an issue creating your profile. Please try again.");
        } finally {
            setIsCreatingProfile(false);
        }
    };

    const renderCreateProfileForm = () => (
        <div className="max-w-2xl mx-auto text-left animate-fade-in">
             <div className="text-center mb-6">
                <Icon name="user-circle" className="w-16 h-16 mx-auto text-stone-600 mb-2" />
                <h3 className="font-semibold text-lg text-stone-800">Create Your Taste Profile</h3>
                <p className="text-sm text-stone-600">Help Liora give you the best recommendations.</p>
            </div>
            <form onSubmit={handleCreateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelStyles}>Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleFormInputChange} className={inputStyles} placeholder="Your name" required />
                    </div>
                    <div>
                        <label className={labelStyles}>City</label>
                        <input type="text" name="city" value={formData.city} onChange={handleFormInputChange} className={inputStyles} placeholder="e.g., Mineola, NY" required />
                    </div>
                </div>
                <div>
                    <label className={labelStyles}>Favorite Cuisines</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {cuisineOptions.map(c => (
                            <button type="button" key={c} onClick={() => handleChipToggle('cuisines', c)} className={`px-3 py-1.5 text-sm rounded-full font-semibold transition-all ${formData.cuisines.includes(c) ? 'bg-brand-400 text-white' : 'bg-cream-200/40 hover:bg-cream-200/50'}`}>{c}</button>
                        ))}
                    </div>
                    <input type="text" name="otherCuisine" value={formData.otherCuisine} onChange={handleFormInputChange} className={`${inputStyles} mt-2`} placeholder="Other..." />
                </div>
                 <div>
                    <label className={labelStyles}>Allergies or Foods to Avoid</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {allergyOptions.map(a => (
                            <button type="button" key={a} onClick={() => handleChipToggle('allergies', a)} className={`px-3 py-1.5 text-sm rounded-full font-semibold transition-all ${formData.allergies.includes(a) ? 'bg-brand-400 text-white' : 'bg-cream-200/40 hover:bg-cream-200/50'}`}>{a}</button>
                        ))}
                    </div>
                     <input type="text" name="otherAllergy" value={formData.otherAllergy} onChange={handleFormInputChange} className={`${inputStyles} mt-2`} placeholder="Other..." />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelStyles}>Budget</label>
                        <select name="budget" value={formData.budget} onChange={handleFormInputChange} className={inputStyles}>
                            {budgetOptions.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className={labelStyles}>Spice Level</label>
                        <select name="spice" value={formData.spice} onChange={handleFormInputChange} className={inputStyles}>
                            {spiceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className={labelStyles}>Diet</label>
                        <select name="diet" value={formData.diet} onChange={handleFormInputChange} className={inputStyles}>
                            {dietOptions.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                      <div>
                        <label className={labelStyles}>Vibe</label>
                        <select name="vibe" value={formData.vibe} onChange={handleFormInputChange} className={inputStyles}>
                            {vibeOptions.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                </div>
                
                {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}

                <button type="submit" disabled={isCreatingProfile} className="w-full flex justify-center items-center bg-brand-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md">
                    {isCreatingProfile ? <><Spinner /> <span className="ml-2">Saving Profile...</span></> : 'Save Profile'}
                </button>
            </form>
        </div>
    );

    const renderProfileSummary = () => (
        <div className="animate-fade-in">
            {successMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-center text-sm font-semibold animate-fade-in">{successMessage}</div>
            )}
            <div className="p-4 bg-cream-50 border border-cream-200 rounded-lg shadow-sm">
                {!profile ? (
                    <div className="text-center text-stone-600 py-8"><Spinner /></div>
                ) : (
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-grow">
                            <h3 className="font-semibold text-lg text-stone-800">Your AI-Generated Profile</h3>
                            <p className="text-sm text-stone-600 italic mt-1 max-w-prose">
                                "{typeof profile.summary === 'string' ? profile.summary : String(profile.summary ?? '')}"
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {Object.entries(profile.profile).map(([key, value]) => {
                                    let displayValue: string;
                                    if (Array.isArray(value)) {
                                        displayValue = value.join(', ');
                                    } else if (value !== null && typeof value === 'object') {
                                        const inner = Object.values(value as Record<string, unknown>).filter(v => typeof v === 'string' || typeof v === 'number');
                                        displayValue = inner.length > 0 ? inner.join(', ') : '';
                                    } else {
                                        displayValue = value == null ? '' : String(value);
                                    }
                                    if (!displayValue || displayValue === '0' || displayValue === 'null' || displayValue === 'undefined') return null;
                                    return (
                                        <div key={key} className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                                            <span className="capitalize font-normal mr-1">{key.replace(/_/g, ' ')}:</span>
                                            {displayValue}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderProfileTab = () => (
        !profile ? renderCreateProfileForm() : renderProfileSummary()
    );
    
    const renderFavoritesTab = () => (
        <div className="space-y-4 animate-fade-in">
            {favorites.length === 0 ? (
                 <div className="text-center text-stone-600 py-8">
                    <Icon name="bookmark" className="w-12 h-12 mx-auto text-stone-600 mb-2" />
                    <p>No favorites saved yet.</p>
                </div>
            ) : favorites.map((fav: ChatMessage) => (
                <div key={fav.id} className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow-sm relative group">
                    <p className="whitespace-pre-wrap text-stone-800">{fav.text}</p>
                    <button
                        onClick={() => removeFavorite(fav.id)}
                        className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove from favorites"
                    >
                        <Icon name="trash" className="w-5 h-5 text-stone-600 hover:text-red-500" />
                    </button>
                </div>
            ))}
        </div>
    );

    const renderOrdersTab = () => (
        <div className="space-y-4 animate-fade-in">
             {pastOrders.length === 0 ? (
                 <div className="text-center text-stone-600 py-8">
                    <Icon name="receipt" className="w-12 h-12 mx-auto text-stone-600 mb-2" />
                    <p>No past orders found.</p>
                    <p className="text-sm">Use the "Mock Order" button on restaurants to add to your history.</p>
                </div>
            ) : pastOrders.map((order: PastOrder) => (
                <div key={order.id} className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold text-md text-stone-800">{order.restaurantName}</h4>
                            <p className="text-xs text-stone-600">{new Date(order.date).toLocaleString()}</p>
                        </div>
                        <p className="font-bold text-lg text-stone-800">{order.total}</p>
                    </div>
                    <ul className="mt-2 pt-2 border-t border-dashed border-cream-200 text-sm space-y-1">
                       {order.items.map((item, index) => (
                            <li key={index} className="flex justify-between text-stone-600">
                               <span>- {item.name}</span>
                               <span>{item.price}</span>
                            </li>
                       ))}
                    </ul>
                </div>
            ))}
        </div>
    );

    const renderSubscriptionTab = () => {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="p-6 bg-cream-50 border border-cream-200 rounded-lg shadow-sm text-center">
                    <Icon name="sparkles" className={`w-16 h-16 mx-auto mb-4 ${isPremium ? 'text-brand-400' : 'text-stone-600'}`} />
                    <h3 className="text-2xl font-lora font-bold text-stone-800">{isPremium ? 'Premium Member' : 'Free Plan'}</h3>
                    <p className="text-stone-600 mt-1">
                        {isPremium 
                            ? canceled 
                                ? `Your ${plan} subscription is set to cancel on ${new Date(renewalDate!).toLocaleDateString()}.`
                                : `Active ${plan} plan. ${isTrial ? 'Trial ends' : 'Renews'} on ${new Date(renewalDate!).toLocaleDateString()}.`
                            : 'Upgrade to unlock Chef Tutor, Date Night Planner, and unlimited features.'}
                    </p>
                    
                    <div className="mt-6">
                        {!isPremium && (
                            <button 
                                onClick={() => openModal()}
                                className="bg-brand-400 text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-all shadow-md"
                            >
                                Upgrade to Premium
                            </button>
                        )}
                        
                        {isPremium && !canceled && (
                            <button 
                                onClick={() => {
                                    if(window.confirm('Are you sure you want to cancel your subscription? You will lose premium access at the end of the billing period.')) {
                                        cancel();
                                    }
                                }}
                                className="text-red-600 hover:text-red-800 font-semibold underline text-sm"
                            >
                                Cancel Subscription
                            </button>
                        )}
                        
                         {isPremium && canceled && (
                            <button 
                                onClick={restore}
                                className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-all shadow-sm"
                            >
                                Reactivate Subscription
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    };

    const renderSettingsTab = () => {
        if (!reminderForm) return null;
        const currentPrefs = profile?.aiPreferences || { tone: 'friendly', style: 'classic' };
        
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="p-4 bg-cream-50 border border-cream-200 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-lg text-stone-800 mb-3">Liora's Personality</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-600">Conversation Tone</label>
                            <div className="mt-2 flex justify-around bg-cream-100/50 rounded-full p-1">
                                {['direct', 'friendly', 'playful'].map(tone => (
                                    <label key={tone} className="w-full text-center">
                                        <input type="radio" name="ai.tone" value={tone} checked={currentPrefs.tone === tone} onChange={handlePrefChange} className="sr-only" />
                                        <span className={`capitalize block w-full py-1.5 rounded-full cursor-pointer text-sm font-semibold transition-colors ${currentPrefs.tone === tone ? 'bg-white shadow text-stone-800' : 'text-stone-600'}`}>{tone}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600">Recommendation Style</label>
                            <div className="mt-2 flex justify-around bg-cream-100/50 rounded-full p-1">
                                {['classic', 'adventurous', 'healthy'].map(style => (
                                    <label key={style} className="w-full text-center">
                                        <input type="radio" name="ai.style" value={style} checked={currentPrefs.style === style} onChange={handlePrefChange} className="sr-only" />
                                        <span className={`capitalize block w-full py-1.5 rounded-full cursor-pointer text-sm font-semibold transition-colors ${currentPrefs.style === style ? 'bg-white shadow text-stone-800' : 'text-stone-600'}`}>{style}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-cream-50 border border-cream-200 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-lg text-stone-800 mb-3">Reminders</h3>
                    {notificationPermission !== 'granted' && (
                        <div className="mb-3 p-3 bg-yellow-100/50 text-yellow-800 text-sm rounded-lg">
                            Enable notifications in your browser to receive reminders.
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="p-3 bg-cream-100/50 rounded-md">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-medium text-stone-600">Meal Logging</span>
                                <input type="checkbox" name="mealLogging.enabled" checked={reminderForm.mealLogging.enabled} onChange={handleReminderFormChange} className="h-6 w-11 rounded-full bg-cream-200/60 relative after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform checked:bg-green-500 checked:after:translate-x-5 appearance-none" />
                            </label>
                            {reminderForm.mealLogging.enabled && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div><label className="text-xs text-stone-600">Breakfast</label><input type="time" name="mealLogging.breakfast" value={reminderForm.mealLogging.breakfast} onChange={handleReminderFormChange} className="mt-1 w-full p-1 border border-cream-200 rounded-md text-sm bg-white"/></div>
                                    <div><label className="text-xs text-stone-600">Lunch</label><input type="time" name="mealLogging.lunch" value={reminderForm.mealLogging.lunch} onChange={handleReminderFormChange} className="mt-1 w-full p-1 border border-cream-200 rounded-md text-sm bg-white"/></div>
                                    <div><label className="text-xs text-stone-600">Dinner</label><input type="time" name="mealLogging.dinner" value={reminderForm.mealLogging.dinner} onChange={handleReminderFormChange} className="mt-1 w-full p-1 border border-cream-200 rounded-md text-sm bg-white"/></div>
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-cream-100/50 rounded-md">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-medium text-stone-600">Drink Water</span>
                                <input type="checkbox" name="drinkWater.enabled" checked={reminderForm.drinkWater.enabled} onChange={handleReminderFormChange} className="h-6 w-11 rounded-full bg-cream-200/60 relative after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform checked:bg-green-500 checked:after:translate-x-5 appearance-none" />
                            </label>
                            {reminderForm.drinkWater.enabled && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                                    <div><label className="text-xs text-stone-600">Interval (min)</label><input type="number" name="drinkWater.interval" value={reminderForm.drinkWater.interval} onChange={handleReminderFormChange} className="mt-1 w-full p-1 border border-cream-200 rounded-md text-sm bg-white"/></div>
                                    <div><label className="text-xs text-stone-600">Start</label><input type="time" name="drinkWater.startTime" value={reminderForm.drinkWater.startTime} onChange={handleReminderFormChange} className="mt-1 w-full p-1 border border-cream-200 rounded-md text-sm bg-white"/></div>
                                    <div><label className="text-xs text-stone-600">End</label><input type="time" name="drinkWater.endTime" value={reminderForm.drinkWater.endTime} onChange={handleReminderFormChange} className="mt-1 w-full p-1 border border-cream-200 rounded-md text-sm bg-white"/></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-4"><button onClick={handleSaveReminders} className="bg-brand-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90">Save Reminders</button></div>
                </div>
                <div className="p-4 bg-red-50/70 border border-red-200 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-lg text-red-800 mb-3">Danger Zone</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button onClick={handleClearHistory} className="w-full text-sm text-center border border-red-400 text-red-700 font-semibold py-2 px-4 rounded-lg hover:bg-red-100 transition-colors">Clear Conversation History</button>
                        <button onClick={handleResetProfile} className="w-full text-sm text-center border border-red-400 text-red-700 font-semibold py-2 px-4 rounded-lg hover:bg-red-100 transition-colors">Reset User Profile</button>
                    </div>
                </div>
            </div>
        );
    };

    if (!session) return null;

    const tabs: { key: ProfileTab; label: string; icon: string }[] = [
        { key: 'profile', label: 'Profile', icon: 'user-circle' },
        { key: 'subscription', label: 'Subscription', icon: 'sparkles' },
        { key: 'favorites', label: 'Favorites', icon: 'bookmark' },
        { key: 'orders', label: 'Order History', icon: 'receipt' },
        { key: 'settings', label: 'Settings', icon: 'scale' },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-lora text-stone-800">My Profile</h2>
                    <p className="text-stone-600">Manage your preferences, view favorites, and see your order history.</p>
                </div>
                <button 
                    onClick={handleLogout}
                    className="border border-gray-500 text-stone-600 font-bold py-2 px-4 rounded-lg hover:bg-cream-100/800/10 transition-colors text-sm"
                >
                    Logout
                </button>
            </div>

            <div className="border-b border-cream-200">
                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-2" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    activeTab === tab.key
                                    ? 'border-brand-400 text-stone-800'
                                    : 'border-transparent text-stone-600 hover:text-stone-600 hover:border-cream-200'
                                }`}
                            >
                                <Icon name={tab.icon} className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            
            <div className={`${activeTab === 'profile' && !profile ? 'flex flex-col items-center justify-center' : ''}`}>
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'subscription' && renderSubscriptionTab()}
                {activeTab === 'favorites' && renderFavoritesTab()}
                {activeTab === 'orders' && renderOrdersTab()}
                {activeTab === 'settings' && renderSettingsTab()}
            </div>
        </div>
    );
};
