'use client';

import React, { useState } from 'react';
import {
  Utensils,
  Sun,
  Coffee,
  Sunset,
  Moon,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Flame,
  ChefHat,
  AlertCircle,
  Edit3,
  Heart,
  ChevronRight,
} from 'lucide-react';

interface MealSection {
  mealType: 'MORNING' | 'LUNCH' | 'EVENING SNACKS' | 'DINNER';
  title: string;
  subtitle: string;
  timeRange: string;
  icon: any;
  accentColor: string;
  bgGradient: string;
  badgeColor: string;
  items: {
    name: string;
    description: string;
    isSpecial?: boolean;
    tag: string;
    diet: 'VEG' | 'EGG' | 'DAIRY' | 'SPECIAL';
  }[];
  chefOnDuty: string;
  status: 'SERVED' | 'ACTIVE_NOW' | 'UPCOMING';
  approxCalories: string;
}

const WEEKLY_MENUS: Record<string, {
  dayName: string;
  tagline: string;
  isSpecialDay?: boolean;
  meals: MealSection[];
}> = {
  sunday: {
    dayName: 'Sunday',
    tagline: 'Weekend Special Feast & Continental Brunch',
    isSpecialDay: true,
    meals: [
      {
        mealType: 'MORNING',
        title: 'Morning Breakfast & Brunch',
        subtitle: 'South Indian & Continental Spread',
        timeRange: '08:00 AM – 10:00 AM',
        icon: Coffee,
        accentColor: '#F36C21',
        bgGradient: 'from-orange-500/10 via-amber-500/5 to-transparent',
        badgeColor: 'bg-orange-50 text-[#F36C21] border-orange-200 dark:bg-orange-950/60 dark:border-orange-800',
        chefOnDuty: 'Chef Rameshwar Singh (Master Cook)',
        status: 'SERVED',
        approxCalories: '480 kcal',
        items: [
          { name: 'Crispy Masala Dosa & Medu Vada', description: 'Freshly griddled with spiced potato stuffing, served with hot sambar', isSpecial: true, tag: 'Signature', diet: 'VEG' },
          { name: 'Coconut & Tomato Onion Chutneys', description: 'Freshly ground coastal tempering with curry leaves and mustard seeds', tag: 'Side', diet: 'VEG' },
          { name: 'Boiled Eggs / Masala Omelette', description: 'Fresh farm eggs with chopped onions, green chilies, and coriander', tag: 'High Protein', diet: 'EGG' },
          { name: 'Cornflakes, Sprouted Moong & Milk', description: 'Hot and cold toned milk with roasted nuts and organic honey', tag: 'Healthy', diet: 'DAIRY' },
          { name: 'Ginger Cardamom Tea & Filter Coffee', description: 'Freshly brewed aromatic morning beverages', tag: 'Beverage', diet: 'DAIRY' },
        ],
      },
      {
        mealType: 'LUNCH',
        title: 'Royal Sunday Feast Lunch',
        subtitle: 'North Indian Delicacy & Rich Curries',
        timeRange: '12:30 PM – 02:45 PM',
        icon: Sun,
        accentColor: '#5B4BFF',
        bgGradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
        badgeColor: 'bg-indigo-50 text-[#5B4BFF] border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-800',
        chefOnDuty: 'Head Chef Mahender & Team',
        status: 'SERVED',
        approxCalories: '720 kcal',
        items: [
          { name: 'Paneer Butter Masala', description: 'Rich tomato cashew gravy with soft cottage cheese cubes & kasuri methi', isSpecial: true, tag: 'Chef Choice', diet: 'DAIRY' },
          { name: 'Dal Makhani (Slow Cooked 12 Hrs)', description: 'Classic black lentils simmered with butter and fresh cream', tag: 'Special', diet: 'DAIRY' },
          { name: 'Jeera Peas Pulao & Steamed Rice', description: 'Aromatic long grain basmati rice tempered with cumin and ghee', tag: 'Rice', diet: 'VEG' },
          { name: 'Tandoori Butter Roti & Garlic Naan', description: 'Freshly baked in clay tandoor and brushed with butter', tag: 'Breads', diet: 'VEG' },
          { name: 'Boondi Mint Raita & Green Salad', description: 'Chilled spiced curd with roasted cumin and crisp salad greens', tag: 'Sides', diet: 'DAIRY' },
          { name: 'Hot Gulab Jamun (2 Pcs)', description: 'Warm fried milk dumplings soaked in cardamom saffron sugar syrup', isSpecial: true, tag: 'Dessert', diet: 'DAIRY' },
        ],
      },
      {
        mealType: 'EVENING SNACKS',
        title: 'Evening Refreshment Counter',
        subtitle: 'Crispy Evening Snacks & Hot Chai',
        timeRange: '05:00 PM – 06:15 PM',
        icon: Sunset,
        accentColor: '#FFB020',
        bgGradient: 'from-amber-500/10 via-yellow-500/5 to-transparent',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800',
        chefOnDuty: 'Halwai Shiv Kumar',
        status: 'SERVED',
        approxCalories: '320 kcal',
        items: [
          { name: 'Crispy Vegetable Samosa & Bread Pakora', description: 'Golden fried spiced potato pastries served piping hot', isSpecial: true, tag: 'Popular', diet: 'VEG' },
          { name: 'Saunth (Tamarind) & Fresh Mint Chutney', description: 'Sweet and tangy dips prepared in-house', tag: 'Dip', diet: 'VEG' },
          { name: 'Kulhad Masala Chai & Lemon Green Tea', description: 'Hot brewed tea with crushed ginger, cardamom, and clove', tag: 'Hot Drink', diet: 'DAIRY' },
        ],
      },
      {
        mealType: 'DINNER',
        title: 'Wholesome Dinner & Night Cap',
        subtitle: 'Nutritious Light Dinner for Sound Sleep',
        timeRange: '08:00 PM – 10:00 PM',
        icon: Moon,
        accentColor: '#00C48C',
        bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
        badgeColor: 'bg-emerald-50 text-[#00C48C] border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800',
        chefOnDuty: 'Chef Surender & Night Shift',
        status: 'ACTIVE_NOW',
        approxCalories: '610 kcal',
        items: [
          { name: 'Mix Seasonal Vegetable Handi', description: 'Fresh cauliflower, carrots, beans, and green peas in mild masala', tag: 'Main Curry', diet: 'VEG' },
          { name: 'Yellow Moong Dal Tadka', description: 'Light digestible protein with desi ghee garlic tempering', tag: 'Lentils', diet: 'VEG' },
          { name: 'Tawa Phulka Roti with Ghee', description: 'Fresh whole wheat rotis puffed on live flame', tag: 'Fresh Breads', diet: 'VEG' },
          { name: 'Steamed Rice & Roasted Papad', description: 'Fluffy steamed rice with crisp cumin papad', tag: 'Rice', diet: 'VEG' },
          { name: 'Kashmiri Rice Kheer / Fresh Custard', description: 'Slow cooked aromatic rice pudding with saffron and raisins', isSpecial: true, tag: 'Sweet', diet: 'DAIRY' },
          { name: 'Warm Turmeric Milk (Haldi Doodh)', description: 'Available at counter for late night library/lab study residents', tag: 'Night Drink', diet: 'DAIRY' },
        ],
      },
    ],
  },
  monday: {
    dayName: 'Monday',
    tagline: 'High Energy Weekday Fuel & Balanced Diet',
    isSpecialDay: false,
    meals: [
      {
        mealType: 'MORNING',
        title: 'Morning Breakfast & Fuel',
        subtitle: 'Nutrient Rich North & West Indian Breakfast',
        timeRange: '07:30 AM – 09:30 AM',
        icon: Coffee,
        accentColor: '#F36C21',
        bgGradient: 'from-orange-500/10 via-amber-500/5 to-transparent',
        badgeColor: 'bg-orange-50 text-[#F36C21] border-orange-200 dark:bg-orange-950/60 dark:border-orange-800',
        chefOnDuty: 'Chef Rameshwar Singh',
        status: 'UPCOMING',
        approxCalories: '450 kcal',
        items: [
          { name: 'Indori Poha with Sev & Fried Peanuts', description: 'Flattened rice tossed with onions, turmeric, mustard seeds & lemon', isSpecial: true, tag: 'Popular', diet: 'VEG' },
          { name: 'Boiled Eggs / Egg Bhurji', description: 'Protein-packed farm egg scramble with fresh coriander', tag: 'Protein', diet: 'EGG' },
          { name: 'Toasted Brown Bread & Butter/Jam', description: 'Whole wheat toast with salted butter and mixed fruit jam', tag: 'Bakery', diet: 'DAIRY' },
          { name: 'Seasonal Cut Fruits (Papaya & Banana)', description: 'Fresh seasonal vitamins bowl', tag: 'Fiber', diet: 'VEG' },
          { name: 'Adrak Masala Chai & Hot Milk', description: 'Fresh dairy milk and spiced tea', tag: 'Beverage', diet: 'DAIRY' },
        ],
      },
      {
        mealType: 'LUNCH',
        title: 'Wholesome Afternoon Lunch',
        subtitle: 'Traditional Home Style Comfort Thali',
        timeRange: '12:30 PM – 02:30 PM',
        icon: Sun,
        accentColor: '#5B4BFF',
        bgGradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
        badgeColor: 'bg-indigo-50 text-[#5B4BFF] border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-800',
        chefOnDuty: 'Chef Mahender',
        status: 'UPCOMING',
        approxCalories: '680 kcal',
        items: [
          { name: 'Punjabi Rajma Masala (Red Kidney Beans)', description: 'Slow simmered kidney beans in robust aromatic ginger onion gravy', isSpecial: true, tag: 'Chef Choice', diet: 'VEG' },
          { name: 'Aloo Gobhi Adraki Dry Sabzi', description: 'Fresh cauliflower and potatoes cooked with julienned ginger', tag: 'Dry Curry', diet: 'VEG' },
          { name: 'Steamed Fragrant Basmati Rice', description: 'Hot steamed long-grain rice perfect with Rajma', tag: 'Staple', diet: 'VEG' },
          { name: 'Tawa Roti & Kachumber Salad', description: 'Fresh whole wheat rotis and diced cucumber-tomato-onion salad', tag: 'Breads & Salad', diet: 'VEG' },
          { name: 'Spiced Buttermilk (Chaas)', description: 'Cooling digestive yogurt drink with roasted cumin & rock salt', tag: 'Cooler', diet: 'DAIRY' },
        ],
      },
      {
        mealType: 'EVENING SNACKS',
        title: 'Evening Refreshment',
        subtitle: 'Healthy Evening Bites',
        timeRange: '05:00 PM – 06:15 PM',
        icon: Sunset,
        accentColor: '#FFB020',
        bgGradient: 'from-amber-500/10 via-yellow-500/5 to-transparent',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800',
        chefOnDuty: 'Halwai Shiv Kumar',
        status: 'UPCOMING',
        approxCalories: '280 kcal',
        items: [
          { name: 'Crispy Veg Cutlet & French Fries', description: 'Crumb-fried potato and green vegetable patties with dip', tag: 'Snack', diet: 'VEG' },
          { name: 'Hot Elaichi Chai & Coffee', description: 'Freshly prepared evening hot beverages', tag: 'Hot Drink', diet: 'DAIRY' },
        ],
      },
      {
        mealType: 'DINNER',
        title: 'Nutritious Night Dinner',
        subtitle: 'Balanced Evening Comfort Meal',
        timeRange: '08:00 PM – 10:00 PM',
        icon: Moon,
        accentColor: '#00C48C',
        bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
        badgeColor: 'bg-emerald-50 text-[#00C48C] border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800',
        chefOnDuty: 'Chef Surender',
        status: 'UPCOMING',
        approxCalories: '590 kcal',
        items: [
          { name: 'Kadai Soya Chaap Masala', description: 'Tender soya chaap roasted with capsicum, onion, and spices', isSpecial: true, tag: 'High Protein', diet: 'VEG' },
          { name: 'Arhar Dal Fry with Jeera Tadka', description: 'Yellow pigeon pea lentils tempered with ghee & green chili', tag: 'Lentils', diet: 'VEG' },
          { name: 'Hot Butter Phulka & Jeera Rice', description: 'Fresh rotis and aromatic cumin rice', tag: 'Staple', diet: 'VEG' },
          { name: 'Moong Dal Halwa / Fruit Jelly', description: 'Rich golden roasted lentil sweet with dry fruits', tag: 'Sweet', diet: 'DAIRY' },
        ],
      },
    ],
  },
};

export default function HostelMessMenuWidget() {
  const [selectedDay, setSelectedDay] = useState<string>('sunday');
  const [selectedMessBlock, setSelectedMessBlock] = useState<string>('boys-block-a');
  const [selectedMealTab, setSelectedMealTab] = useState<'ALL' | 'MORNING' | 'LUNCH' | 'EVENING SNACKS' | 'DINNER'>('ALL');
  const [showDietNotice, setShowDietNotice] = useState(false);

  const activeDayData = WEEKLY_MENUS[selectedDay] || WEEKLY_MENUS['sunday'];
  const mealsToRender = selectedMealTab === 'ALL'
    ? activeDayData.meals
    : activeDayData.meals.filter((m) => m.mealType === selectedMealTab);

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all space-y-6">
      {/* Top Header: Title, Mess Block Selector & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E7EAF3] dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F36C21] to-amber-500 flex items-center justify-center text-white text-xl shadow-md shadow-orange-500/20 shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-[#1B1E28] dark:text-white uppercase tracking-wider font-sans">
                HOSTEL MESS & RESIDENT DINING MENU
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#00C48C]/10 text-[#00C48C] text-[10px] font-black border border-[#00C48C]/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>FSSAI Quality Certified</span>
              </span>
            </div>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 font-semibold mt-0.5">
              4-Course Daily Residential Catering Schedule: Morning • Lunch • Evening Snacks • Dinner
            </p>
          </div>
        </div>

        {/* Mess Block & Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <select
              value={selectedMessBlock}
              onChange={(e) => setSelectedMessBlock(e.target.value)}
              aria-label="Select Hostel Dining Hall"
              className="appearance-none bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs py-2 pl-3.5 pr-8 rounded-xl cursor-pointer hover:border-[#5B4BFF] transition-all shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#5B4BFF]/20"
            >
              <option value="boys-block-a">Boys Hostel (Block A & B Central Mess)</option>
              <option value="girls-gargi">Girls Hostel (Gargi Block Dining)</option>
              <option value="pg-medical">PG Medical & Faculty Residence Dining</option>
            </select>
          </div>

          <button
            onClick={() => setShowDietNotice(!showDietNotice)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Special Diet / Sick Meals</span>
          </button>
        </div>
      </div>

      {/* Special Diet Notice Banner Expandable */}
      {showDietNotice && (
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-extrabold">Warden Special Meal Protocol & Sick Diet Requisition</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                Residents requiring convalescent diet (Moong Dal Khichdi, Boiled Vegetables, Dalia, Electral Glucose) can be sanctioned by the Warden via one-click approval on the resident ledger.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDietNotice(false)}
            className="text-amber-600 hover:text-amber-800 font-black text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Day Selector Navigation Pills & Day Tagline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F6F8FC]/80 dark:bg-slate-850 p-3 rounded-2xl border border-[#E7EAF3] dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['sunday', 'monday'].map((dayKey) => {
            const isSelected = selectedDay === dayKey;
            const dayMeta = WEEKLY_MENUS[dayKey];

            return (
              <button
                key={dayKey}
                onClick={() => setSelectedDay(dayKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] text-white shadow-md shadow-indigo-500/25 scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-700'
                }`}
              >
                <span>{dayMeta.dayName}</span>
                {dayMeta.isSpecialDay && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#F36C21] text-white font-extrabold uppercase">
                    Feast
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#4E5969] dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-[#F36C21]" />
          <span>{activeDayData.tagline}</span>
        </div>
      </div>

      {/* 4 Meal Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All 4 Meals', icon: Utensils },
          { key: 'MORNING', label: '1. Morning Breakfast', icon: Coffee },
          { key: 'LUNCH', label: '2. Lunch', icon: Sun },
          { key: 'EVENING SNACKS', label: '3. Evening Snacks', icon: Sunset },
          { key: 'DINNER', label: '4. Dinner', icon: Moon },
        ].map((tab) => {
          const isCurrent = selectedMealTab === tab.key;
          const IconComp = tab.icon;

          return (
            <button
              key={tab.key}
              onClick={() => setSelectedMealTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-[#F36C21] text-white shadow-sm shadow-orange-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4 Meal Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {mealsToRender.map((meal, idx) => {
          const MealIcon = meal.icon;

          return (
            <div
              key={meal.mealType}
              className="h-full flex flex-col justify-between p-5 rounded-[22px] bg-white dark:bg-slate-850 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-md hover:border-[#5B4BFF]/40 transition-all space-y-4 relative overflow-hidden group"
            >
              {/* Top Banner Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E7EAF3] dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: meal.accentColor }}
                  >
                    <MealIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {meal.mealType}
                      </span>
                      {meal.status === 'ACTIVE_NOW' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#00C48C] text-[10px] font-black border border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-800 animate-pulse">
                          ● Serving Now
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-[#1B1E28] dark:text-white mt-1 group-hover:text-[#5B4BFF] transition-colors">
                      {meal.title}
                    </h3>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#F36C21]" />
                    <span>{meal.timeRange}</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 block mt-1">
                    Est. {meal.approxCalories}
                  </span>
                </div>
              </div>

              {/* Food Items List */}
              <div className="flex-1 space-y-2.5">
                {meal.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      item.isSpecial
                        ? 'bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent border-orange-200/70 dark:border-orange-900/40 dark:bg-slate-800/80'
                        : 'bg-[#F6F8FC]/60 dark:bg-slate-800/40 border-[#E7EAF3] dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-[#1B1E28] dark:text-white">
                          {item.name}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded ${
                            item.diet === 'EGG'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : item.diet === 'DAIRY'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          }`}
                        >
                          {item.diet}
                        </span>
                        {item.isSpecial && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#F36C21] text-white">
                            ★ {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chef In-Charge & Footer */}
              <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 shrink-0 mt-auto flex items-center justify-between text-xs font-bold text-[#4E5969] dark:text-slate-400">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <ChefHat className="w-3.5 h-3.5 text-[#5B4BFF]" />
                  <span>{meal.chefOnDuty}</span>
                </div>
                <span className="text-[#F36C21] font-bold">Mess Verified ✓</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
